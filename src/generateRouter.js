import { isDir, checkFile, rootPathSearch } from './util'

const path = require('path')
const fs = require('fs')

/*
* 解析 controller 目录
* @param {filePath: sting} controller 目录的绝对地址
* @param {controller: Array} 一个数组,解析后将返回
* @param {rootPath: sting} 解析 path 时表示前缀
* @return {controller: Array} 解析后的 controller 目录对象[{[xx]: export xx from xx.vue }]
* */
function directoryIndex (filePath, controller, rootPath) {
  const filesNameList = fs.readdirSync(filePath)
  filesNameList.forEach(fileName => {
    const composePath = `${rootPath}/${fileName}`
    const currentPath = path.join(filePath, fileName)
    if (isDir(currentPath)) {
      directoryIndex(currentPath, controller, composePath)
    } else if (/\.vue$/.test(fileName)) {
      controller.push({
        [fileName.split('.')[0]]: `export ${fileName.split('.')[0]} from '${composePath}'`
      })
    }
  })
  return controller
}

/*
* 将一层目录的文件转成数组
* @param {filesNameList:Array} 文件名数组
* @param {rootPath: string} 文件夹路径
* @param {mark: string} 文件夹路径
* @param {flag: Boolean} 表示是否要解析controller,并生成index文件,和是否要写如到vue.index
* @return {children: Array} 目录转化成成路由对象
* */
function parseCatalogue (filesNameList, rootPath, mark, flag) {
  const children = []
  mark = mark || ''
  filesNameList.forEach(fileName => {
    const fileDirPath = path.join(rootPath, fileName)
    const dirFlag = isDir(fileDirPath)
    const isCompose = fileName.toLocaleLowerCase() === 'controller'
    if (dirFlag && !isCompose) {
      children.push({
        path: `${mark}${fileName}`
      })
    } else if (isCompose && flag) {
      // 读取所有的 controller 写入index.vue
      const composeIndexPath = path.join(rootPath, 'controller', 'index.js')
      // 解析 controller 文件
      const composeData = directoryIndex(fileDirPath, [], '.')
      const composeDataValues = composeData.map(itme => Object.values(itme))
      const composeDataKeys = composeData.map(itme => Object.keys(itme))
      fs.writeFileSync(composeIndexPath, composeDataValues.join('\n'))
      const strContentData = fs.readFileSync(path.join(rootPath, 'index.vue'), 'utf8')
      const repContent = /<script>\nimport {.*} from '\.\/controller'/
      let indexVueContentData
      if (repContent.test(strContentData)) {
        indexVueContentData = strContentData.replace(repContent, () => {
          return `<script>\nimport {${composeDataKeys.join(', ')}} from './controller'`
        })
      } else {
        indexVueContentData = strContentData.replace('<script>', () => {
          return `<script>\nimport {${composeDataKeys.join(', ')}} from './controller'`
        })
      }

      fs.writeFileSync(path.join(rootPath, 'index.vue'), indexVueContentData)
    }
  })
  return children
}

/*
* 将json文件解析成对象
* @param {indexFilePath:string} 要解析的json文件绝对路径
* @return {Object} 转化后的对象
* */
function parseScript (indexFilePath) {
  const strContentData = fs.readFileSync(indexFilePath, 'utf8')
  return JSON.parse(strContentData)
}

/*
* 将文件目录解析成路由对象,ps:这个方法有点乱,以后优化
* @param {filePath:string} 要解析成路由的目录
* @param {router:Object} 路由对象
* @param {routerPath:string} 这个参数主要目录是要解析vue router的 path
* @param {mark:string} 为了实现 vue router children下path没有/
* @return {route:Object} vue router 对象
* */
function parseRouter (filePath, router, routerPath, mark) {
  // 将格式.//不正确的路径转化为 ./ 的格式
  routerPath = routerPath.replace(/(\.)\/(\/.*)/, (a, b, c) => b + c)
  const filesNameList = fs.readdirSync(filePath)
  const indexFlag = filesNameList.includes('index.vue')
  if (indexFlag) {
    const indexFilePath = path.join(filePath, 'routeConfig.json')
    if (checkFile(indexFilePath)) {
      const scriptObject = parseScript(indexFilePath)
      router = Object.assign(router, scriptObject)
    }
    router.component = `() => import('${routerPath}/index.vue')`
  }
  // 解析一层目录
  const childrenList = parseCatalogue(filesNameList, filePath, mark, indexFlag)
  if (!childrenList.length) {
    return
  }
  router.children = childrenList
  router.children.forEach(item => {
    const fileDirPath = path.join(filePath, item.path)
    // 递归其他路径
    parseRouter(fileDirPath, item, `${routerPath}/${item.path}`)
  })
  return Object.values(router.children)
}

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

function generateRouter (url) {
  const rootPath = rootPathSearch(url)
  const targetPath = path.join(rootPath, 'index.js')
  const router = parseRouter(rootPath, {}, '.', '/')
  const strRouter = formatWriteObject(router)
  fs.writeFileSync(targetPath, `export default ${strRouter}`)
}

export {
  generateRouter
}
