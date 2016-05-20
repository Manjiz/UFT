/*
Navicat MySQL Data Transfer

Source Server         : localhost_3306
Source Server Version : 50626
Source Host           : localhost:3306
Source Database       : uft

Target Server Type    : MYSQL
Target Server Version : 50626
File Encoding         : 65001

Date: 2016-05-20 15:30:28
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for admin
-- ----------------------------
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(32) NOT NULL,
  `password` char(32) NOT NULL,
  `lastLogin` datetime DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of admin
-- ----------------------------
INSERT INTO `admin` VALUES ('1', 'admin', 'da796bdd2d23f88b82dbffbfc24225e5', '2016-01-04 19:55:18', '0');

-- ----------------------------
-- Table structure for business
-- ----------------------------
DROP TABLE IF EXISTS `business`;
CREATE TABLE `business` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `parentID` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_business_parentid` (`parentID`),
  CONSTRAINT `fk_business_parentID` FOREIGN KEY (`parentID`) REFERENCES `business` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of business
-- ----------------------------
INSERT INTO `business` VALUES ('1', '拍拍', '3', '0');
INSERT INTO `business` VALUES ('2', '京东', null, '0');
INSERT INTO `business` VALUES ('3', '创新APP', '4', '0');
INSERT INTO `business` VALUES ('4', '二手APP', '1', '0');
INSERT INTO `business` VALUES ('5', '快乐APP', null, '1');
INSERT INTO `business` VALUES ('6', '呵呵呵哒', '3', '1');
INSERT INTO `business` VALUES ('7', '阿道夫但是', null, '1');
INSERT INTO `business` VALUES ('8', '请问', null, '1');
INSERT INTO `business` VALUES ('9', '谢晓立', null, '1');
INSERT INTO `business` VALUES ('10', '精致衣橱', '2', '0');

-- ----------------------------
-- Table structure for demand
-- ----------------------------
DROP TABLE IF EXISTS `demand`;
CREATE TABLE `demand` (
  `demandID` bigint(16) NOT NULL DEFAULT '0',
  `dtype` int(11) NOT NULL,
  `business` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `ua` text,
  `state` int(11) NOT NULL DEFAULT '0',
  `submitDate` datetime NOT NULL,
  `executor` char(32) DEFAULT NULL,
  `solver` char(32) DEFAULT NULL,
  `solveDate` datetime DEFAULT NULL,
  `solveMsg` text,
  `status` int(11) NOT NULL DEFAULT '0',
  `submitter` char(32) NOT NULL,
  `executeDate` datetime DEFAULT NULL,
  PRIMARY KEY (`demandID`),
  KEY `fk_demand_dtype` (`dtype`),
  KEY `fk_demand_business` (`business`),
  KEY `fk_demand_executor` (`executor`),
  KEY `fk_demand_solver` (`solver`),
  KEY `fk_demand_submitter` (`submitter`),
  CONSTRAINT `fk_demand_business` FOREIGN KEY (`business`) REFERENCES `business` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_demand_dtype` FOREIGN KEY (`dtype`) REFERENCES `dtype` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_demand_executor` FOREIGN KEY (`executor`) REFERENCES `user` (`erp`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_demand_solver` FOREIGN KEY (`solver`) REFERENCES `user` (`erp`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_demand_submitter` FOREIGN KEY (`submitter`) REFERENCES `user` (`erp`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of demand
-- ----------------------------
INSERT INTO `demand` VALUES ('20160520022313', '1', '2', '每日精 - 京东上线', '轮播的顺序有问题，太振看看是不是哪里有问题？', '{\"width\":1588,\"height\":711,\"dpr\":1,\"ua\":{\"ua\":\"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36\",\"browser\":{\"name\":\"Chrome\",\"version\":\"50.0.2661.94\",\"major\":\"50\"},\"engine\":{\"version\":\"537.36\",\"name\":\"WebKit\"},\"os\":{\"name\":\"Windows\",\"version\":\"7\"},\"device\":{},\"cpu\":{\"architecture\":\"amd64\"}}}', '1', '2016-05-20 10:23:13', 'zhangtaizhen', null, null, null, '0', 'zhangtaizhen', null);

-- ----------------------------
-- Table structure for demandfiles
-- ----------------------------
DROP TABLE IF EXISTS `demandfiles`;
CREATE TABLE `demandfiles` (
  `filename` bigint(24) NOT NULL,
  `demandid` bigint(16) NOT NULL,
  `originalname` varchar(64) NOT NULL,
  `mimetype` text,
  `uerp` char(32) NOT NULL,
  `date` datetime NOT NULL,
  `download` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`filename`),
  KEY `fk_demandFiles_demandid` (`demandid`),
  KEY `fk_demandFiles_uerp` (`uerp`),
  CONSTRAINT `fk_demandFiles_demandid` FOREIGN KEY (`demandid`) REFERENCES `demand` (`demandID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_demandFiles_uerp` FOREIGN KEY (`uerp`) REFERENCES `user` (`erp`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of demandfiles
-- ----------------------------
INSERT INTO `demandfiles` VALUES ('2016052010231172', '20160520022313', 'MyCats_569fe68a3700452f1bbc5f83.jpeg', 'image/jpeg', 'zhangtaizhen', '2016-05-20 10:23:13', '0');

-- ----------------------------
-- Table structure for dep
-- ----------------------------
DROP TABLE IF EXISTS `dep`;
CREATE TABLE `dep` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `depType` char(16) DEFAULT NULL,
  `demander` tinyint(1) unsigned zerofill NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of dep
-- ----------------------------
INSERT INTO `dep` VALUES ('1', '前端一组', '业务', '0', '0');
INSERT INTO `dep` VALUES ('2', '前端二组', '开发', '0', '0');
INSERT INTO `dep` VALUES ('4', '业务需求方', '开发', '1', '0');

-- ----------------------------
-- Table structure for device
-- ----------------------------
DROP TABLE IF EXISTS `device`;
CREATE TABLE `device` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `owner` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_device` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of device
-- ----------------------------

-- ----------------------------
-- Table structure for dtype
-- ----------------------------
DROP TABLE IF EXISTS `dtype`;
CREATE TABLE `dtype` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of dtype
-- ----------------------------
INSERT INTO `dtype` VALUES ('1', '日常需求', '0');
INSERT INTO `dtype` VALUES ('2', '临时迭代', '0');
INSERT INTO `dtype` VALUES ('3', 'BUG缺陷', '0');
INSERT INTO `dtype` VALUES ('4', '什么鬼', '1');
INSERT INTO `dtype` VALUES ('5', '什么鬼部门', '1');
INSERT INTO `dtype` VALUES ('6', '呵呵哒', '1');
INSERT INTO `dtype` VALUES ('7', '呵呵哒', '0');
INSERT INTO `dtype` VALUES ('8', 'fdsf', '0');
INSERT INTO `dtype` VALUES ('9', 'fdsfsd', '0');
INSERT INTO `dtype` VALUES ('10', 'ggg', '0');

-- ----------------------------
-- Table structure for schedule
-- ----------------------------
DROP TABLE IF EXISTS `schedule`;
CREATE TABLE `schedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `demandID` bigint(16) NOT NULL,
  `dictator` char(32) NOT NULL,
  `assignee` char(32) NOT NULL,
  `startDate` datetime NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `days` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_schedule_demandID` (`demandID`),
  KEY `fk_schedule_dictator` (`dictator`),
  KEY `fk_schedule_assignee` (`assignee`),
  CONSTRAINT `fk_schedule_assignee` FOREIGN KEY (`assignee`) REFERENCES `user` (`erp`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_schedule_demandID` FOREIGN KEY (`demandID`) REFERENCES `demand` (`demandID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_schedule_dictator` FOREIGN KEY (`dictator`) REFERENCES `user` (`erp`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of schedule
-- ----------------------------
INSERT INTO `schedule` VALUES ('37', '20160520022313', 'zhangtaizhen', 'xiexiaoli', '2016-05-16 08:00:00', '0', '4');

-- ----------------------------
-- Table structure for statistics
-- ----------------------------
DROP TABLE IF EXISTS `statistics`;
CREATE TABLE `statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(32) NOT NULL DEFAULT '0',
  `theDate` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of statistics
-- ----------------------------

-- ----------------------------
-- Table structure for test
-- ----------------------------
DROP TABLE IF EXISTS `test`;
CREATE TABLE `test` (
  `name` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of test
-- ----------------------------

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `erp` char(32) NOT NULL,
  `email` char(24) NOT NULL,
  `password` char(32) NOT NULL,
  `name` varchar(64) NOT NULL,
  `depID` int(11) DEFAULT NULL,
  `lastLogin` datetime DEFAULT NULL,
  `token` varchar(32) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `isAdmin` tinyint(11) NOT NULL DEFAULT '0',
  `regpid` char(32) DEFAULT NULL,
  `avatar` text,
  `showMeInSchedule` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `erp` (`erp`),
  KEY `fk_user_depid` (`depID`),
  CONSTRAINT `fk_user_depID` FOREIGN KEY (`depID`) REFERENCES `dep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES ('1', 'liyixin', 'liyixin@jd.com', 'da796bdd2d23f88b82dbffbfc24225e5', '李怡欣', '2', null, null, '0', '0', null, null, '1');
INSERT INTO `user` VALUES ('3', 'xiexiaoli', 'xiexiaoli@jd.com', 'da796bdd2d23f88b82dbffbfc24225e5', '谢晓立', '4', '2015-12-17 17:39:34', null, '0', '0', null, null, '1');
INSERT INTO `user` VALUES ('4', 'xiexiaoli2', 'xiexiaoli2@jd.com', 'da796bdd2d23f88b82dbffbfc24225e5', '谢晓立2', '2', null, null, '0', '0', null, null, '1');
INSERT INTO `user` VALUES ('5', 'xiexiaoli3', 'xiexiaoli3@jd.com', 'da796bdd2d23f88b82dbffbfc24225e5', '谢晓立3', '1', null, null, '0', '0', null, null, '1');
INSERT INTO `user` VALUES ('6', 'xiexiaoli8', 'xiexiaoli@jd.com', 'da796bdd2d23f88b82dbffbfc24225e5', 'xiexiaoli8', '1', null, null, '0', '0', null, null, '1');
INSERT INTO `user` VALUES ('21', 'zhangtaizhen', 'zhangtaizhen@jd.com', '8748788ee78bbbbee00c3d519211ca5d', '张太振', '2', '2016-05-20 13:28:36', null, '0', '1', null, 'data:image/jpg;base64,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', '1');
