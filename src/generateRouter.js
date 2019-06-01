import { isDir, checkFile, rootPathSearch, isFile } from './util'

const path = require('path')
const fs = require('fs')

/*
* 格式化路由对象输出对象
* @param {route:Object} 路由对象
* @return {route:string} 格式化后的路由string类型的对象
* */
function formatWriteObject (route) {
  route = route || {}
  return JSON.stringify(route)
    .replace(/("component":)"(.*?)"/g, (a, key, val) => {
      return `${key}${val}`
    })
    .replace(/\"/g, '\'')
    .replace(/\[\{/g, '[\n{')
    .replace(/}]/g, '}\n]')
    .replace(/,/g, ',\n')
}

/*
* 解析所有 Compose 组件文件路径
* @param { filePath: string } compose文件夹绝对路径
* @return { composeList：Array }  compose文件对象 [{filesName:Relative path }]
* */
function parseCompose (fileDirPath, composeList = [], rootPath = '.') {
  const filesNameList = fs.readdirSync(fileDirPath)
  filesNameList.forEach(filesName => {
    const currentPath = path.join(fileDirPath, filesName)
    if (isFile(currentPath) && /\.vue$/.test(filesName)) {
      composeList.push({ [filesName.split('.vue')[0]]: `${rootPath}/${filesName}` })
    } else if (isDir(currentPath)) {
      parseCompose(currentPath, composeList, `${rootPath}/${filesName}`)
    }
  })
  return composeList
}

/*
* 创建 所有 compose 的文件入口
* @param { filePath: string } compose文件夹绝对路径
* @return { undefined } 创建 index.js 为 compose 入口文件
* */
function writeIndex (filePath) {
  const contentList = parseCompose(filePath)
  const composeIndexPath = path.join(filePath, 'index.js')
  const content = contentList.map(item => {
    const [[key, value]] = Object.entries(item)
    return `export ${key} from '${value}'`
  })
  fs.writeFileSync(composeIndexPath, content.join('\n'))
}

/*
* 生成路由的一项配置
* @param { rootPath: string } 文件夹深度路径
* @param { flagChildrenPath: Boolean } 区分是不是 children 文件夹递归调用,
*                                      but:目前还是无法区分 children 的文件夹下的文件 path 路径，现在直接解析为一级
* @param { childrenFlag: Boolean } 是否有 children 文件夹
* @param { childrenFilePath: string } children 文件夹绝对路径
* @return { itemRouter: Object } 一项路由的配置
* */
function generateItemRouter (rootPath, flagChildrenPath, childrenFlag, childrenFilePath) {
  const path = flagChildrenPath
    ? rootPath.split('/').pop()
    : rootPath.replace(/^./, '')

  const itemRouter = {
    path,
    component: `() => import('${rootPath}/index.vue')`
  }

  if (childrenFlag) {
    const children = parseRouter(childrenFilePath, [], `${rootPath}/children`, true)
    if (children.length) {
      itemRouter.children = children
    }
  }
  return itemRouter
}

/*
* 解析 index.vue 文件里的 routerConfig 字段，but：routerConfig必须在最后一下配置
* @param { filePath: string } index.vue的绝对路径
* @return { routerConfig: Object } routerConfig 配置对象
* */
function ParseIndexVueRouteConfig (filePath) {
  const strContentData = fs.readFileSync(filePath, 'utf8')
  let content
  try {
    const strScript = strContentData.split('<script>')[1].split('</script>')[0].split('default')[1]
    const scrRouterConfig = strScript.split('routerConfig')[1].replace(/(;|\r|\n|\s)/g, '').slice(1, -1)
    content = new Function(`return ${scrRouterConfig}`)()
  } catch (e) {
    content = {}
  }
  return content
}

/*
* 解析文件成路由对象
* @param { filePath: String } 要解析成路由的文件夹绝对路径
* @param { router: Array } 路由对象,递归是用到，无需传出
* @param { rootPath: String } 当前文件夹深度路径，递归是用到，无需传出
* @param { flagChildrenPath: Boolean } 区分是不是 children 文件夹递归调用,
*                                      but:目前还是无法区分 children 的文件夹下的文件 path 路径，现在直接解析为一级
* @return { route: Array } vue的 route 路由对象
* */
function parseRouter (filePath, router = [], rootPath = '.', flagChildrenPath) {
  const filesNameListIgnore = ['children', 'compose']
  const filesNameList = fs.readdirSync(filePath)
  const indexFilePath = path.join(filePath, 'index.vue')
  const childrenFilePath = path.join(filePath, 'children')
  const composeFilePath = path.join(filePath, 'compose')
  const routeFlag = checkFile(indexFilePath) && isFile(indexFilePath)
  const childrenFlag = checkFile(childrenFilePath) && isDir(childrenFilePath)
  const composeFlag = checkFile(composeFilePath) && isDir(composeFilePath)
  if (routeFlag) {
    if (composeFlag) {
      writeIndex(composeFilePath)
    }
    const itemRouter = generateItemRouter(rootPath, flagChildrenPath, childrenFlag, childrenFilePath)
    const routeConfig = ParseIndexVueRouteConfig(indexFilePath)
    router.push(Object.assign(itemRouter, routeConfig))
  }
  filesNameList.forEach(fileName => {
    const itemFilePath = path.join(filePath, fileName)
    if (!isDir(itemFilePath) || filesNameListIgnore.includes(fileName)) return
    parseRouter(itemFilePath, router, `${rootPath}/${fileName}`, flagChildrenPath)
  })
  return router
}

/*
* 将文件成定义成 vue router对象
* @param { filePath: String } 要定义成路由的文件夹绝对路径
* @return { route: Array } vue的 route 路由对象写入 filePath 文件下的 index.js
* */
function generateRouter (filePath) {
  const rootPath = rootPathSearch(filePath)
  const targetPath = path.join(rootPath, 'index.js')
  const router = parseRouter(rootPath)
  const strRouter = formatWriteObject(router)
  fs.writeFileSync(targetPath, `export default ${strRouter}`)
}

export {
  generateRouter
}
