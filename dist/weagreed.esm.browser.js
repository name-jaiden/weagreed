/**
 * weagreed v0.0.9
 * (c) 2019 Jaiden
 * @license MIT
 */
const path = require('path');
const fs = require('fs');

/*
* 定位到根路径下,读取路径
* @param {dir:string} 根路径下的文件路径
* @return {dirPath} 返回该文件的绝对路径
* */
const rootPathSearch = dir => {
  const root = path.resolve(__dirname, './../../../');
  return path.resolve(root, dir)
};

/*
* 判断是不是一个文件
* @param {path:string} 文件的绝对路径
* @return Boolean 检测改文件是不是一个文件
* */
const isFile = function isFile (path) {
  return fs.statSync(path).isFile()
};

/*
* 判断是不是一个文件夹
* @param {path:string} 文件夹的绝对路径
* @return {Boolean} 检测改文件是不是一个文件夹
* */
const isDir = function isDir (path) {
  return fs.statSync(path).isDirectory()
};

/*
* 判断文件或文件夹是否存在
* @param {path:string} 目标的绝对路径
* @return {Boolean} 是否存在改文件或文件夹
* */
const checkFile = function checkFile (path) {
  return fs.existsSync(path)
};

/*
* 检测目录下是否有指定文件夹
* @param {ruleFolderList:Array} 指定的文件夹名称
* @param {targetPath:string} 目标目录的路径
* @return {Error} 如路径没有指定的文件,抛出异常
* */
function checkMustFolderList (ruleFolderList, targetPath) {
  ruleFolderList.forEach(fileName => {
    const src = rootPathSearch(`${targetPath}/${fileName}`);
    if (!checkFile(src)) {
      console.error(`lack of a necessary folder ${fileName}`);
      throw new Error()
    }
  });
}

const path$1 = require('path');
const fs$1 = require('fs');

/*
* 格式化路由对象输出对象
* @param {route:Object} 路由对象
* @return {route:string} 格式化后的路由string类型的对象
* */
function formatWriteObject (route) {
  route = route || {};
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
  const filesNameList = fs$1.readdirSync(fileDirPath);
  filesNameList.forEach(filesName => {
    const currentPath = path$1.join(fileDirPath, filesName);
    if (isFile(currentPath) && /\.vue$/.test(filesName)) {
      composeList.push({ [filesName.split('.vue')[0]]: `${rootPath}/${filesName}` });
    } else if (isDir(currentPath)) {
      parseCompose(currentPath, composeList, `${rootPath}/${filesName}`);
    }
  });
  return composeList
}

/*
* 创建 所有 compose 的文件入口
* @param { filePath: string } compose文件夹绝对路径
* @return { undefined } 创建 index.js 为 compose 入口文件
* */
function writeIndex (filePath) {
  const contentList = parseCompose(filePath);
  const composeIndexPath = path$1.join(filePath, 'index.js');
  const content = contentList.map(item => {
    const [[key, value]] = Object.entries(item);
    return `export ${key} from '${value}'`
  });
  fs$1.writeFileSync(composeIndexPath, content.join('\n'));
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
    : rootPath.replace(/^./, '');

  const itemRouter = {
    path,
    component: `() => import('${rootPath}/index.vue')`
  };

  if (childrenFlag) {
    const children = parseRouter(childrenFilePath, [], `${rootPath}/children`, true);
    if (children.length) {
      itemRouter.children = children;
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
  const strContentData = fs$1.readFileSync(filePath, 'utf8');
  let content;
  try {
    const strScript = strContentData.split('<script>')[1].split('</script>')[0].split('default')[1];
    const scrRouterConfig = strScript.split('routerConfig')[1].replace(/(;|\r|\n|\s)/g, '').slice(1, -1);
    content = new Function(`return ${scrRouterConfig}`)();
  } catch (e) {
    content = {};
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
  const filesNameListIgnore = ['children', 'compose'];
  const filesNameList = fs$1.readdirSync(filePath);
  const indexFilePath = path$1.join(filePath, 'index.vue');
  const childrenFilePath = path$1.join(filePath, 'children');
  const composeFilePath = path$1.join(filePath, 'compose');
  const routeFlag = checkFile(indexFilePath) && isFile(indexFilePath);
  const childrenFlag = checkFile(childrenFilePath) && isDir(childrenFilePath);
  const composeFlag = checkFile(composeFilePath) && isDir(composeFilePath);
  if (routeFlag) {
    if (composeFlag) {
      writeIndex(composeFilePath);
    }
    const itemRouter = generateItemRouter(rootPath, flagChildrenPath, childrenFlag, childrenFilePath);
    const routeConfig = ParseIndexVueRouteConfig(indexFilePath);
    router.push(Object.assign(itemRouter, routeConfig));
  }
  filesNameList.forEach(fileName => {
    const itemFilePath = path$1.join(filePath, fileName);
    if (!isDir(itemFilePath) || filesNameListIgnore.includes(fileName)) return
    parseRouter(itemFilePath, router, `${rootPath}/${fileName}`, flagChildrenPath);
  });
  return router
}

/*
* 将文件成定义成 vue router对象
* @param { filePath: String } 要定义成路由的文件夹绝对路径
* @return { route: Array } vue的 route 路由对象写入 filePath 文件下的 index.js
* */
function generateRouter (filePath) {
  const rootPath = rootPathSearch(filePath);
  const targetPath = path$1.join(rootPath, 'index.js');
  const router = parseRouter(rootPath);
  const strRouter = formatWriteObject(router);
  fs$1.writeFileSync(targetPath, `export default ${strRouter}`);
}

/*
* 检测必要的文件目录
* */
const ruleFolderList = ['Api', 'Components', 'controllers', 'Pages', 'Servers', 'Ui'];
checkMustFolderList(ruleFolderList, 'src');

/*
* 生成Pages文件夹下的路由
* */
generateRouter('src/Pages');

var index_esm = {
  checkMustFolderList,
  generateRouter,
  version: '0.0.9'
};

export default index_esm;
export { checkMustFolderList, generateRouter };
