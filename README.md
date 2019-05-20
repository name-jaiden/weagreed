# weagreed

> 一个 vue/cli 项目目录管理插件 -> [weagreed 文档](https://github.com/name-jaiden/weagreed#readme)

## 简介
`weagreed` vue/cli 3.x 项目目录管理插件,配和SPA项目构建时使用,可以自动生成vue router。


## 主要特性

- 更高效的管理vue/cli的SPA项目目录.
- 无侵入式管理,层次更为鲜明,代码更易维护.
- 自动生成vue路由开发更省力.

其它特性正在等着你去探索。欢迎您提交[Issues](https://github.com/name-jaiden/weagreed/issues) 

## 如何使用

#### 第一步:
``` js
// npm install weagreed --save-dev
npm install weagreed-alpha --save-dev

```
#### 第二步: 在 package.json 添加配置
``` js
// package.json
    ...
    "scripts": {
        "weagreed": "node node_modules/weagreed-alpha",
        "serve": "npm run weagreed && vue-cli-service serve",
        "build": "npm run weagreed && vue-cli-service build"
    },
    ...
```


## 配置详情

我们约定有一下目录

* `Api`
* `Components`
* `controllers`
* `Pages`
* `Servers`
* `Ui`

#### Api
#### Components
#### controllers
#### Pages
    Pages 文件夹下的第一层文件夹视为一级路由(controller文件夹除外),
    子文件夹视为二级路由,以此类推,文件夹下的index.vue作为controller的入口,
    文件夹下的routeConfig.json作为路由配置入口
#### Servers
#### Ui
