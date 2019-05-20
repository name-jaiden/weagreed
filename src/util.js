const path = require('path')
const fs = require('fs')

/*
* 定位到根路径下,读取路径
* @param {dir:string} 根路径下的文件路径
* @return {dirPath} 返回该文件的绝对路径
* */
export const rootPathSearch = dir => {
  const root = path.resolve(__dirname, './../../../')
  return path.resolve(root, dir)
}

/*
* 判断是不是一个对象
* @param {obj:any}
* @return {Boolean} 检测源是不是一个对象
* */
export const isObject = function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/*
* 判断是不是一个文件
* @param {path:string} 文件的绝对路径
* @return Boolean 检测改文件是不是一个文件
* */
export const isFile = function isFile (path) {
  return fs.statSync(path).isFile()
}

/*
* 判断是不是一个文件夹
* @param {path:string} 文件夹的绝对路径
* @return {Boolean} 检测改文件是不是一个文件夹
* */
export const isDir = function isDir (path) {
  return fs.statSync(path).isDirectory()
}

/*
* 判断文件或文件夹是否存在
* @param {path:string} 目标的绝对路径
* @return {Boolean} 是否存在改文件或文件夹
* */
export const checkFile = function checkFile (path) {
  return fs.existsSync(path)
}
