import { checkMustFolderList } from './checkFolder'
import { generateRouter } from './generateRouter'

/*
* 检测必要的文件目录
* */
const ruleFolderList = ['Api', 'Components', 'Controllers', 'Pages', 'Servers', 'Ui']
checkMustFolderList(ruleFolderList, 'src')

/*
* 生成Pages文件夹下的路由
* */
generateRouter('src/Pages')

export default {
  checkMustFolderList,
  generateRouter,
  version: '__VERSION__'
}
