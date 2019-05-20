import { rootPathSearch, checkFile } from './util'

/*
* 检测目录下是否有指定文件夹
* @param {ruleFolderList:Array} 指定的文件夹名称
* @param {targetPath:string} 目标目录的路径
* @return {Error} 如路径没有指定的文件,抛出异常
* */
function checkMustFolderList (ruleFolderList, targetPath) {
  ruleFolderList.forEach(fileName => {
    const src = rootPathSearch(`${targetPath}/${fileName}`)
    if (!checkFile(src)) {
      console.error(`lack of a necessary folder ${fileName}`)
      throw new Error()
    }
  })
}

export {
  checkMustFolderList
}
