/**
 * weagreed v0.0.3
 * (c) 2019 Jaiden
 * @license MIT
 */
var path = require('path');
var fs = require('fs');

/*
* 定位到根路径下,读取路径
* @param {dir:string} 根路径下的文件路径
* @return {dirPath} 返回该文件的绝对路径
* */
var rootPathSearch = function (dir) {
  var root = path.resolve(__dirname, './../../../');
  return path.resolve(root, dir)
};

/*
* 判断是不是一个文件夹
* @param {path:string} 文件夹的绝对路径
* @return {Boolean} 检测改文件是不是一个文件夹
* */
var isDir = function isDir (path) {
  return fs.statSync(path).isDirectory()
};

/*
* 判断文件或文件夹是否存在
* @param {path:string} 目标的绝对路径
* @return {Boolean} 是否存在改文件或文件夹
* */
var checkFile = function checkFile (path) {
  return fs.existsSync(path)
};

/*
* 检测目录下是否有指定文件夹
* @param {ruleFolderList:Array} 指定的文件夹名称
* @param {targetPath:string} 目标目录的路径
* @return {Error} 如路径没有指定的文件,抛出异常
* */
function checkMustFolderList (ruleFolderList, targetPath) {
  ruleFolderList.forEach(function (fileName) {
    var src = rootPathSearch((targetPath + "/" + fileName));
    if (!checkFile(src)) {
      console.error(("lack of a necessary folder " + fileName));
      throw new Error()
    }
  });
}

var path$1 = require('path');
var fs$1 = require('fs');

/*
* 解析 controller 目录
* @param {filePath: sting} controller 目录的绝对地址
* @param {controller: Array} 一个数组,解析后将返回
* @param {rootPath: sting} 解析 path 时表示前缀
* @return {controller: Array} 解析后的 controller 目录对象[{[xx]: export xx from xx.vue }]
* */
function directoryIndex (filePath, controller, rootPath) {
  var filesNameList = fs$1.readdirSync(filePath);
  filesNameList.forEach(function (fileName) {
    var obj;

    var composePath = rootPath + "/" + fileName;
    var currentPath = path$1.join(filePath, fileName);
    if (isDir(currentPath)) {
      directoryIndex(currentPath, controller, composePath);
    } else if (/\.vue$/.test(fileName)) {
      controller.push(( obj = {}, obj[fileName.split('.')[0]] = ("export " + (fileName.split('.')[0]) + " from '" + composePath + "'"), obj ));
    }
  });
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
  var children = [];
  mark = mark || '';
  filesNameList.forEach(function (fileName) {
    var fileDirPath = path$1.join(rootPath, fileName);
    var dirFlag = isDir(fileDirPath);
    var isCompose = fileName.toLocaleLowerCase() === 'controller';
    if (dirFlag && !isCompose) {
      children.push({
        path: ("" + mark + fileName)
      });
    } else if (isCompose && flag) {
      // 读取所有的 controller 写入index.vue
      var composeIndexPath = path$1.join(rootPath, 'controller', 'index.js');
      // 解析 controller 文件
      var composeData = directoryIndex(fileDirPath, [], '.');
      var composeDataValues = composeData.map(function (itme) { return Object.values(itme); });
      var composeDataKeys = composeData.map(function (itme) { return Object.keys(itme); });
      fs$1.writeFileSync(composeIndexPath, composeDataValues.join('\n'));
      var strContentData = fs$1.readFileSync(path$1.join(rootPath, 'index.vue'), 'utf8');
      var repContent = /<script>\nimport {.*} from '\.\/controller'/;
      var indexVueContentData;
      if (repContent.test(strContentData)) {
        indexVueContentData = strContentData.replace(repContent, function () {
          return ("<script>\nimport {" + (composeDataKeys.join(', ')) + "} from './controller'")
        });
      } else {
        indexVueContentData = strContentData.replace('<script>', function () {
          return ("<script>\nimport {" + (composeDataKeys.join(', ')) + "} from './controller'")
        });
      }

      fs$1.writeFileSync(path$1.join(rootPath, 'index.vue'), indexVueContentData);
    }
  });
  return children
}

/*
* 将json文件解析成对象
* @param {indexFilePath:string} 要解析的json文件绝对路径
* @return {Object} 转化后的对象
* */
function parseScript (indexFilePath) {
  var strContentData = fs$1.readFileSync(indexFilePath, 'utf8');
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
  routerPath = routerPath.replace(/(\.)\/(\/.*)/, function (a, b, c) { return b + c; });
  var filesNameList = fs$1.readdirSync(filePath);
  var indexFlag = filesNameList.includes('index.vue');
  if (indexFlag) {
    var indexFilePath = path$1.join(filePath, 'routeConfig.json');
    if (checkFile(indexFilePath)) {
      var scriptObject = parseScript(indexFilePath);
      router = Object.assign(router, scriptObject);
    }
    router.component = "() => import('" + routerPath + "/index.vue')";
  }
  // 解析一层目录
  var childrenList = parseCatalogue(filesNameList, filePath, mark, indexFlag);
  if (!childrenList.length) {
    return
  }
  router.children = childrenList;
  router.children.forEach(function (item) {
    var fileDirPath = path$1.join(filePath, item.path);
    // 递归其他路径
    parseRouter(fileDirPath, item, (routerPath + "/" + (item.path)));
  });
  return Object.values(router.children)
}

/*
* 格式化路由对象输出对象
* @param {route:Object} 路由对象
* @return {route:string} 格式化后的路由string类型的对象
* */
function formatWriteObject (route) {
  route = route || {};
  return JSON.stringify(route)
    .replace(/("component":)"(.*?)"/g, function (a, key, val) {
      return ("" + key + val)
    })
    .replace(/\"/g, '\'')
    .replace(/\[\{/g, '[\n{')
    .replace(/}]/g, '}\n]')
    .replace(/,/g, ',\n')
}

function generateRouter (url) {
  var rootPath = rootPathSearch(url);
  var targetPath = path$1.join(rootPath, 'index.js');
  var router = parseRouter(rootPath, {}, '.', '/');
  var strRouter = formatWriteObject(router);
  fs$1.writeFileSync(targetPath, ("export default " + strRouter));
}

/*
* 检测必要的文件目录
* */
var ruleFolderList = ['Api', 'Components', 'controllers', 'Pages', 'Servers', 'Ui'];
checkMustFolderList(ruleFolderList, 'src');

/*
* 生成Pages文件夹下的路由
* */
generateRouter('src/Pages');

var index_esm = {
  checkMustFolderList: checkMustFolderList,
  generateRouter: generateRouter,
  version: '0.0.3'
};

export default index_esm;
export { checkMustFolderList, generateRouter };
