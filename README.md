# UFT 前端需求提交平台及管理后台

随着前端需求的增多，团队需要一个平台来管理需求进程，让需求动态及时触达相关人员，给需求相关人员统一的沟通交流方式，让需求数据更直观地被展示出来，同时也有利于需求的归档查询。UFT ，为需求而生。

- [架构图](http://naotu.baidu.com/file/15371b9a7691fbd529d6cb8d744ba7e7?token=55e245a819077ea9)

- [开发日志](https://github.com/o2team/UFT/wiki/%E5%BC%80%E5%8F%91%E6%97%A5%E5%BF%97)

## 部署指引

``` bash
# 安装NodeJS（>=4.4.4）
# 安装MySQL（>=5.6）

git clone https://github.com/o2team/UFT.git
cd UFT
npm install
mv conf-server.dev.js conf-server.js

# 配置 ./conf-server.js

# 导入 ./归档/uft.sql

# 启动服务器
node server
```

## 参与人员

张太振、王彩暖、李怡欣

## 移动优先

* 767px
* 992px