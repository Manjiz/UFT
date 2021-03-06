﻿var _confServer = require('../conf-server.js')(),
	mysql = require('./mysql'),
	pool = mysql.pool,
	
	async = require('async'),
	fs = require('fs'),

	nodemailer = require('nodemailer'),
	sharp = require('sharp'),
	request = require('request'),
	md5 = require('md5');

// 邮箱配置
var transporter = nodemailer.createTransport(_confServer.nodemailer);

/**
 * erp email password name depID lastLogin token isAdmin regpid status
 */
exports.UserModel = {
	findbackList: [],

	/**
	 * ======================================================
	 *  注册新用户
	 *   @params erp email password name [depID]
	 * ======================================================
	 */
	add: function(req, res) {
		var erp = req.body.erp,
			email = req.body.email,
			password = req.body.password,
			name = req.body.name,
			depID = req.body.depID ? parseInt(req.body.depID) : null;

		if(erp && email && name) {
			pool.getConnection(function(err, conn) {
				conn.query('SELECT * FROM user WHERE erp=? AND status=0', [erp], function(err, rows, fields) {
					if(err) throw err;
					if(rows.length>0) {
						res.json({state: 'fail', msg: '用户已存在，请不要重复注册'});
						conn.release();
					} else {
						// 先删除可能存在的已关闭的同ERP用户，% 这一步不一定能顺利完成 %
						conn.query('DELETE FROM user WHERE erp=? AND status<>0', [erp], function(err, result) {
							if(err) throw err;
							var regpid = new Date().getTime();
							conn.query('INSERT INTO user (erp, email, password, name, depID, regpid, status) VALUES (?,?,MD5(?),?,?,?,?)', [erp, email, password, name, depID, regpid, 1], function(err, result) {
								if(err) throw err;
								if(result.affectedRows>0) {
									transporter.sendMail({
										from: 'JDC多终端研发部<jdc_fd@163.com>',
								    	to: email,
								    	subject: '【用户注册】'+erp,
								    	html: '如果不是您的操作，请忽略该邮件：'+
								    	'<br>请于4小时内 '+
								    	'<a href="'+_confServer.referer+'api/user/add/'+erp+'/'+regpid+'">点击链接</a> 确认身份！'
									}, function(err, info){
								    	if(err){ return console.log(err); }
								    	console.log('Mail To: '+email);
								    	console.log('Sent: ' + info.response);
								    	res.json({state:'success', msg:'验证邮件已发'});
									});
								} else {
									res.json({state: 'fail', msg: '未知错误'});
								}
								conn.release();
							});
						});
					}
				});
			});
		} else if(!erp) {
			res.json({state: 'fail', msg: 'ERP 不能为空'});
		} else if (!email) {
			res.json({state: 'fail', msg: '邮箱不能为空'});
		} else if (!name) {
			res.json({state: 'fail', msg: '名字不能为空'});
		} else {
			res.json({state: 'fail', msg: '未知错误'});
		}
	},
	addCheck: function(req, res) {
		var erp = req.params.erp,
			mailcheck = req.params.mailcheck;
		if(erp && mailcheck) {
			pool.getConnection(function(err, conn) {
				if(err) throw err;
				conn.query('SELECT * FROM user WHERE erp=? AND regpid=?', [erp, mailcheck], function(err, rows) {
					if(err) throw err;
					if(rows.length>0) {
						var user = rows[0];
						var shadowTime = new Date().getTime() - parseInt(user.regpid);
						if(shadowTime) {
							// 4小时的有效验证时间
							if(shadowTime>=14400000) {
								conn.release();
								// 160520 - 启用错误码识别 ecode (error code)
								res.json({state: 'fail', ecode:3, msg: '链接失效'});
							} else {
								conn.query('UPDATE user SET regpid=null, status=0 WHERE erp=?', [user.erp], function(err, result) {
									if(err) throw err;
									if(result.affectedRows>0) {
										// 160519 - 启用短的成功验证符 succ
										// res.json({state:'succ', msg: '验证成功'});

										req.session.erp = user.erp;
										req.session.name = user.name;
										req.session.isAdmin  = user.isAdmin;

										res.redirect(_confServer.referer);
									} else {
										res.json({state:'fail', ecode:4, msg: '未知错误'});
									}
									conn.release();
								});
							}
						} else {
							conn.release();
							res.json({state: 'fail', ecode:2, msg: '链接错误'});
						}
					} else {
						conn.release();
						res.json({state: 'fail', ecode:1, msg: '链接错误'});
					}
				});
			});
		} else {
			res.json({state: 'fail', ecode:0, msg: '链接错误'});
		}
	},
	/**
	 * ======================================================
	 *  删除用户
	 *  ! 限管理平台使用
	 *   @params erp
	 * ======================================================
	 */
	del: function(req, res) {
		var erp = req.body.erp;
		if(erp) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE user SET status=1 WHERE erp=?', [erp], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state: 'success', erp:erp, msg: '删除用户成功'});
					} else {
						res.json({state: 'fail', msg: '删除用户失败'});
					}
					conn.release();
				})
			});
		} else {
			res.json({state: 'fail', msg: '删除未知用户'});
		}
	},
	/**
	 * ======================================================
	 *  获取用户信息
	 *   @params erp
	 * ======================================================
	 */
	getByErp: function(req, res) {
		var erp = req.query.erp || '';
		if(erp) {
			pool.getConnection(function(err, conn) {
				conn.query('SELECT user.name, email, avatar, depID, dep.name as depName, dep.demander as depDemander from user LEFT JOIN dep ON user.depID=dep.id WHERE erp=? AND user.status=0', [erp], function(err, rows, fields) {
					if(err) throw err;
					res.send(rows.length>0 ? rows[0] : null);
					conn.release();
				});
			});
		} else {
			res.send(null);
		}
	},
	/**
	 * ======================================================
	 *  登录
	 *   @params erp password
	 * ======================================================
	 */
	login: function(req, res) {
		var erp = req.body.erp,
			pass = req.body.password;
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM user WHERE erp=? AND status=0', [erp], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					req.session.erp = rows[0].erp;
					req.session.name = rows[0].name;
					req.session.isAdmin  = rows[0].isAdmin;
					conn.query('UPDATE user SET lastLogin=? WHERE erp=?', [new Date(), erp], function(err, result) {
						if(err) throw err;
						conn.release();
					});
					res.send(req.session);
				} else {
					res.sendStatus(401);
					conn.release();
				}
			})
		});
	},
	/**
	 * ======================================================
	 *  用户清单
	 * ======================================================
	 */
	list: function(req, res) {
		if(req.session.erp) {
			pool.getConnection(function(err, conn) {
				conn.query('SELECT '
					+ 'user.name, user.erp, CONCAT(user.name,"(", user.erp, ")") as nameConcatErp, user.email, user.depID, user.isAdmin, user.showMeInSchedule, '
					+ 'dep.name as depName '
					+ 'FROM user '
					+ 'LEFT JOIN dep ON user.depID=dep.id '
					+ 'WHERE user.status=0', function(err, rows, fields) {
					if(err) throw err;
					res.send(JSON.stringify(rows));
					conn.release();
				});
			});
		} else {
			res.send('未授权');
		}
	},
	/**
	 * ======================================================
	 *  找回密码
	 * ======================================================
	 */
	findBack2: function(req, res) {
		var that = this;
		var account = req.params.account;
		var newpwd = req.params.newpwd;	//MD5密码，不用再次加密
		var findid = req.params.findid;	//如果有findid说明是邮箱验证这一步了
		if( account && newpwd ) {
			pool.getConnection(function(err, conn) {
				if(err) throw err;
				conn.query('SELECT * FROM user WHERE (erp=? OR email=?) AND status=0 LIMIT 1', [account, account], function(err, rows, fields) {
					if(err) throw err;
					if(rows.length<=0) {
						conn.release();
						return res.json({state:'fail', msg:'查无此人'});
					}
					var user = rows[0];
					if(!user.email) {
						conn.release();
						return res.json({state:'fail', msg:'按理说，邮箱应该是必需字段'});
					}
					// 可能为NaN
					var shadowTime = new Date().getTime() - parseInt(user.regpid); 

					// 4小时内验证
					if(shadowTime && shadowTime<=14400000) {
						if(findid) {
							//-------------------------------------------------- 下
							// 暗号对合
							if(findid==user.regpid) {
								conn.query('UPDATE user SET password=?, regpid=null WHERE erp=?', [newpwd, user.erp], function(err, result) {
									if(err) throw err;
									if(result.affectedRows>0) {
										// res.json({state:'success', msg:'修改成功'});
										res.redirect(_confServer.referer+'#/piecemeal-findback/succ');
									} else {
										res.json({state:'fail', msg:'未知错误'});
									}
									conn.release();
								});
							} else {
								conn.release();
								return res.json({state:'fail', msg:'错误的验证链接'});
							}
							//-------------------------------------------------- 上
						} else {
							conn.release();
							return res.json({state:'fail', msg:'请不要频繁申请修改密码'});
						}
					} else if(shadowTime>14400000 && findid) {
						//-------------------------------------------------- 下
						conn.release();
						res.json({state:'fail', msg:'链接已过期'});
						//-------------------------------------------------- 上
					} else {
						// 这里是  regpid为null / shadowTime超时&&无findid
						var newRegpid = new Date().getTime();
						conn.query('UPDATE user SET regpid=? WHERE erp=?', [newRegpid, user.erp], function(err, result) {
							if(err) throw err;
							if(result.affectedRows>0) {
								transporter.sendMail({
										from: 'JDC多终端研发部<jdc_fd@163.com>',
								    	to: user.email,
								    	subject: '【找回密码】'+user.erp,
								    	html: '如果不是您的操作，请忽略该邮件：'+
								    	'<br>请于4小时内 '+
								    	'<a href="'+_confServer.referer+'api/user/findback/'+user.erp+'/'+md5(newpwd)+'/'+newRegpid+'">点击链接</a> 确认修改密码！'
									}, function(err, info){
								    	if(err){ return console.log(err); }
								    	console.log('Mail To: '+user.email);
								    	console.log('Sent: ' + info.response);
								    	res.json({state:'success', msg:'验证邮件已发'});
								});
							} else {
								res.json({state:'fail', msg:'未知错误'});
							}
							conn.release();
						});
					}
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	},
	/**
	 * ======================================================
	 *  更新用户信息
	 *  ! 限管理平台使用
	 *   @params erp name email depID
	 * ======================================================
	 */
	update: function(req, res) {
		var erp = req.body.erp,
			name = req.body.name,
			email = req.body.email,
			depID = parseInt(req.body.depID) || null,
			isAdmin = req.body.isAdmin || 0,
			showMeInSchedule = req.body.showMeInSchedule===0 ? 0 : 1;
		console.log(erp, name, email, depID, showMeInSchedule)
		if(erp && name && email && depID) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE user SET name=?, email=?, depID=?, isAdmin=?, showMeInSchedule=? WHERE erp=? AND status=0', [name, email, depID, isAdmin, showMeInSchedule, erp], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', erp:erp, msg:'更新用户信息成功'});
					} else {
						res.json({state:'fail', msg:'用户不存在'});
					}
					conn.release();
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	},
	/**
	 * ======================================================
	 *  更新个人信息
	 *   @params oldpwd newpwd
	 * ======================================================
	 */
	updateUser: function(req, res) {
		var uerp = req.body.uerp,
			uname = req.body.uname,
			uemail = req.body.uemail,
			udep = req.body.udep || null;

		if(uerp!=req.session.erp) { return res.json({state:'fail', msg:'恶意请求'}); }

		if(uerp && uname && uemail) {
			pool.getConnection(function(err, conn) {
				conn.query('SELECT erp FROM user WHERE email=? AND erp<>?', [uemail, uerp], function(err, rows, fields) {
					if(err) throw err;
					if(rows.length>0) {
						conn.release();
						res.json({state:'fail', msg:'邮箱不能重复'});
					} else {
						conn.query('UPDATE user SET name=?, email=?, depID=? WHERE erp=? AND status=0', [uname, uemail, udep, uerp], function(err, result) {
							if(err) throw err;
							if(result.affectedRows>0) {
								res.cookie('uerp', uerp);
								res.cookie('uname', uname);
								res.json({state:'success', msg:'用户信息修改成功'});
							} else {
								res.json({state:'fail', msg:'未知错误'});
							}
							conn.release();
						});
					}
				});
			});
		} else {
			res.json({state:'fail', msg:'信息不全'});
		}
	},
	/**
	 * ======================================================
	 *  更新头像
	 * ======================================================
	 */
	updateAvatar: function(req, res) {
		var avatar = req.body.avatar,
			cropContext = req.body.cropContext;
		if(avatar && cropContext && req.session && req.session.erp) {
			var images = sharp(_confServer.tempPath+'/'+avatar);
			var dataPromise = images
				.metadata()
				.then(function(metadata) {
					if(cropContext.top>=metadata.height) {
						cropContext.top = metadata.height - 1;	// 最少是 1x1
					} else if(cropContext.top<0) {
						cropContext.top = 0;
					}
					if(cropContext.left>=metadata.width) {
						cropContext.left = metadata.width - 1;
					} else if(cropContext.left<0) {
						cropContext.left = 0;
					}
					if(cropContext.width > metadata.width) {
						cropContext.width = cropContext.height = metadata.width
					}
					if(cropContext.height > metadata.height) {
						cropContext.width = cropContext.height = metadata.height
					}
					return images.extract({top:cropContext.top, left:cropContext.left, width:cropContext.width, height:cropContext.height})
						.resize(100, 100)
						.sharpen()
						.quality(100)
						.toBuffer();
				});

			pool.getConnection(function(err, conn) {
				dataPromise.then(function(buffer) {
					var data = 'data:image/jpg;base64,' + buffer.toString('base64');
					conn.query('UPDATE user SET avatar=? WHERE erp=?', [data, req.session.erp], function(err, result) {
						if(err) throw err;
						if(result.affectedRows>0) {
							res.json({state:'success', avatar:data});
						} else {
							res.json({state:'fail'});
						}
						conn.release();
					});
				}).catch(function() {
					res.json({state:'fail'});
					conn.release();
				});
			});
		}
	}
}