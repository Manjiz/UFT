# UFT 前端需求提交平台及管理后台

## 整体规划

### 项目介绍

随着前端需求的增多，团队需要一个平台来管理需求进程，让需求动态及时触达相关人员，给需求相关人员统一的沟通交流方式，让需求数据更直观地被展示出来，同时也有利于需求的归档查询。UFT ，为需求而生。

### 架构

* [点击查看架构图](http://naotu.baidu.com/file/15371b9a7691fbd529d6cb8d744ba7e7?token=55e245a819077ea9)

### 参与人员

张太振、王彩暖

### 当前进度

目前 UFT 趋于稳定，可以满足基本的前端工作流程需要，细节方面仍需调整，用户体验方面有待提升。

## 技术概要

### 项目部署

1. 安装 MySQL@5.6.*
2. 安装 Node.js@0.12.*
3. 导入数据库文件 uft.sql
4. 配置 conf-server.js 文件
	* 邮箱配置信息
	* 数据库配置信息（*）
	* 异步文件临时目录（*）
	* 上传文件存储目录（*）
5. 配置 conf.js 文件（可选）
6. >> npm install
7. 启动服务：
	* >> node server
	* >> forever server.js（需先 >> npm i -g forever）

### 源码

* [源码](https://github.com/o2team/UFT)

## 规范（移动优先）

### 组件

* 色调：
	* 主色：`#6190e8`
	* 副色：`#008e59`
* 通用距离：10Npx
* 按钮：
	* 圆角：3px
	* 颜色：
		* 主颜色：`#e12228`
		* 不可用：`#e1aaa8`
		* 加深色：`#d12228`（hover / active）
	* 尺寸：
		* 标准按钮 30x100 —— .btn.btn-normal
		* 大型按钮 35x100 —— .btn.btn-large
* 输入 —— input.inp-text ：
	* 正常：
		* 圆角：3px
		* 边框：`#ccc`
		* 背景：`#fafafa`
		* 阴影：`box-shadow:inset 0 1px 2px rgba(0,0,0,0.075);`
		* 动效：`transition:border-color ease-in-out .15s, box-shadow ease-in-out .15s;`
	* FOCUS：
		* 边框：`#66afe9`
		* 背景：`#fff`
		* 阴影：`box-shadow:inset 0 1px 2px rgba(0,0,0,0.075),0 0 5px rgba(81,167,232,0.5);`
		* 动效：`transition:0;`

### 响应式

* 阶梯一：767px
* 阶梯二：992px

## 阶段优化

* [151102](https://github.com/o2team/UFT/blob/master/Rs151102.md)
* [151208](https://github.com/o2team/UFT/blob/master/Rs151208.md)

**CheckList**

- [ ] 广场游客用户和非管理员用户不能看到未审核需求
- [ ] 拖动排期功能
- [ ] 一键邮送排期表功能
- [ ] 详情头部 UI 优化
- [ ] 附件信息展示
- [ ] 头像系统
- [ ] Profile 响应式页面
- [ ] 消息中心
- [ ] 响应式头部导航
- [ ] “我的”和“待审”响应式页面