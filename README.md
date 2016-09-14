# Uuaper

[![NPM Version][npm-image]][npm-url]
![NODE Version][node-image]
![OSX Build][osx-image]
![LINUX Build][liunx-image]

Proxy tool for front-end development based on NodeJS.

## Features

* baidu uuuap/passport 自动登录

## Install

``` bash
    npm install --save uuaper
```

## Get Start

### 自定义Cookie

```js
var uuaper = require('uuaper');
var uuap = new uuaper({
    cookie: 'xxx',
    service: 'http://yyy.baidu.com/'
});
```

### uuap自动登录

```js
var uuaper = require('uuaper');
var uuap = new uuaper({
    username: 'xxx',
    password: 'xxx',
    uuapServer: 'http://xxx.baidu.com/login',
    service: 'http://yyy.baidu.com/'
});
```

### 使用uuaper内置server

```js
uuap.startServer({
    port: 1337, //server端口，不设置默认为1337
    staticPath: __dirname, //静态资源路径，必须设置
    proxyPath: ['/tic', '/pgm'] //proxy路径
});
```

#### 结合express使用实现接口转发功能

```js
var express = require('express');
var app = express();

var uuaper = require('uuaper');
var uuap = new uuaper({
    username: 'xxx',
    password: 'xxx',
    uuapServer: 'http://xxx.baidu.com/login',
    service: 'http://yyy.baidu.com/',
    debug: true,
    mockDir: __dirname + '/mock'
});

app.use('/api', uuap.loadData);
```

## 配置项

- **service** (必需配置，目标server，或者登出你们的系统，然后取url中service参数)
- cookie (自定义cookie，配置了该参数就无需配置`username/password/uuapServer`)
- username  (用户名)
- password  (密码)
- uuapServer (uuap认证服务器，记得带login参数)
- server (转发server默认会取service参数中的域，但是有些项目比较奇葩，故提供该参数)
- debug (是否打开转发信息，默认`false`不开启)
- mockDir (如果配置，则会在第一次接口请求结束后存储数据到文件)
- mock (是否启用mock本地数据，依赖`mockDir`，如果本地不存在该文件，则会取一遍，默认`false`)
- mockCache (是否每次请求都进行保存操作，依赖`mockDir`参数，默认`false`不开启)

##TODO

*  mock 支持带参数的url
*  ~~bprouting 302 deal~~
*  ~~支持配置项~~
*  ~~数据mock~~
*  ~~mock no cache~~
*  ~~静态资源文件proxy~~
*  优化结构
*  Do more...

## History

- [1.3.0] 重构proxy模块，也许是该项目最大的一次重构
<!-- - [1.2.10] 完善res.headers处理 -->
<!-- - [1.2.8] 移除res.text空判断 -->
- [1.2.6] res.headers原封不动返回，来解决流形式响应
- [1.2.3] 增加cookie参数，如果配置，就不使用默认的uuap自动获取方式
<!-- - [1.2.0] 增加对静态资源文件的转发支持 -->
<!-- - [1.1.4] 增加`mockCache`参数，如果为`true`，则每次请求都会进行保存到本地的操作 -->
- [1.1.0] 增加接口数据mock功能
<!-- - [1.0.5] `server`参数改成非必须参数，默认取service中的域，但是有些项目比较奇葩，故提供该参数 -->
- [1.0.x] 重构，使用[bird-auth](https://www.npmjs.com/package/bird-auth)包进行cookie获取，同时优化内置server
- [0.1.7] 老版本


[npm-image]: https://img.shields.io/badge/npm-v1.3.0-blue.svg
[npm-url]: https://npmjs.org/package/uuaper
[node-image]: https://img.shields.io/badge/node-v0.12.0%2B-yellow.svg
[osx-image]: https://img.shields.io/badge/OSX-passing-brightgreen.svg
[liunx-image]: https://img.shields.io/badge/Liunx-passing-brightgreen.svg
