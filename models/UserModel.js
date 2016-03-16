var _confServer = require('../conf-server.js')(),
	mysql = require('../mysql'),
	pool = mysql.pool,
	
	async = require('async'),
	fs = require('fs'),

	nodemailer = require('nodemailer'),
	nodeimg = require('images'),
	request = require('request');

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
		var erp = req.query.erp,
			email = req.query.email,
			password = req.query.password || 123456,
			name = req.query.name,
			depID = req.query.depID || null;

		if(erp && email && password && name) {

			request({
				method: 'POST',
				url: _confServer.erpauth,
				timeout: 1500,
				gzip: true,
				form: {
					v: req.cookies['erp1.jd.com']
				}
			}, function (error, response, body) {
				if (!error && response.statusCode == 200 && body && body.length<20 && erp==body) {

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
									conn.query('INSERT INTO user (erp, email, password, name, depID, status) VALUES (?,?,MD5(?),?,?,?)', [erp, email, 123456, name, depID, 0], function(err, result) {
										if(err) throw err;
										if(result.affectedRows>0) {
											res.json({state: 'success', msg: '添加用户成功，等待用户邮箱验证', returnurl:_confServer.returnUrl + '#/gallery'});
										} else {
											res.json({state: 'fail', msg: '未知错误'});
										}
										conn.release();
									});
								});
							}
						});
					});

				} else {
					res.json({state: 'fail', msg: '未知错误'});
				}
			});

		} else if(!erp) {
			res.json({state: 'fail', msg: 'ERP 不能为空'});conn.release();
		} else if (!email) {
			res.json({state: 'fail', msg: '邮箱不能为空'});conn.release();
		} else if (!name) {
			res.json({state: 'fail', msg: '名字不能为空'});conn.release();
		} else if (!password) {
			res.json({state: 'fail', msg: '密码不能为空'});conn.release();
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
				conn.query('SELECT user.name, email, avatar, depID, dep.name as depName from user LEFT JOIN dep ON user.depID=dep.id WHERE erp=? AND user.status=0', [erp], function(err, rows, fields) {
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
	 *   @params erp
	 * ======================================================
	 */
	login: function(req, res) {
		var erp = req.body.erp;
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM user WHERE erp=? AND status=0', [erp], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					req.session.loginederp = rows[0].erp;		//session ERP
					req.session.isAdmin  = rows[0].isAdmin;		//session 管理员
					res.cookie('uerp', rows[0].erp);
					res.cookie('uname', rows[0].name);
					conn.query('UPDATE user SET lastLogin=? WHERE erp=?', [new Date(), erp], function(err, result) {
						if(err) throw err;
						conn.release();
					});
				} else {
					res.cookie('verp', erp);
					conn.release();
				}
				res.send(req.session)
			})
		});
	},
	/**
	 * ======================================================
	 *  用户清单
	 * ======================================================
	 */
	list: function(req, res) {
		if(req.session.loginederp) {
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
	findBack: function(req, res) {
		var that = this;
		pool.getConnection(function(err, conn) {
			var erp = req.params.erp,
				random = req.params.random,
				randomCode = Math.floor(Math.random()*10000000);
			conn.query('SELECT * FROM user WHERE erp=? AND status=0', [erp], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					if(!random) {
						if(that.findbackList[erp]) {
							res.json({state:'fail', msg:'你最近进行过找回密码操作，请尽快完成'});
						} else {
							that.findbackList[erp] = randomCode;
							transporter.sendMail({
									from: 'JDC多终端研发部<jdc_fd@163.com>',
							    	to: rows[0].email,
							    	subject: '【找回密码】'+erp,
							    	html: '如果不是您的操作，请忽略该邮件：<br>请尽快 <a href="http://'+req.headers.host+'/api/user/findback/'+erp+'/'+randomCode+'">点击链接</a> 找回您的密码！'
								}, function(error, info){
							    	if(error){
							    	    return console.log(error);
							    	}
							    	console.log('Message sent: ' + info.response);
							    	res.send({state:'success', msg:'验证邮件已发'})
							});
						}
						conn.release();
					} else {
						if(that.findbackList[erp] == random) {
							var newPwd = Math.random().toString(16).substr(2).substring(0, 6);
							conn.query('UPDATE user SET password=MD5(?) WHERE erp=?', [newPwd, erp], function(err, result) {
								if(err) throw err;
								if(result.affectedRows>0) {
									transporter.sendMail({
											from: 'JDC多终端研发部<jdc_fd@163.com>',
									    	to: rows[0].email,
									    	subject: '【找回密码】'+erp,
									    	html: '<div>' + erp + '，您好！您的密码已经重置为：</div>' + '<div style="text-indent:10em;font-size:36px;font-weight:bold;background:#ccc;">'+newPwd+'</div><div>请尽快登录修改密码。</div>'
										}, function(error, info){
									    	if(error){
									    	    return console.log(error);
									    	}
									    	console.log('Message sent: ' + info.response);
									    	delete that.findbackList[erp];
									    	res.redirect('../../../../state.html#findback_succ');
									});
								}
								conn.release();
							})
						} else {
							res.send({state:'fail', msg:'链接失效'});
							conn.release();
						}
					}
				}
			});
		});
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
		if(uerp && uerp==req.session.loginederp && uname && uemail) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE user SET name=?, email=?, depID=? WHERE erp=? AND status=0', [uname, uemail, udep, uerp], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.cookie('uerp', uerp);
						res.cookie('uname', uname);
						res.json({state:'success', msg:'用户信息修改成功'});
					} else {
						res.json({state:'fail', msg:'未知错误'});
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
		if(avatar && cropContext && req.session && req.session.loginederp) {
			var data = 'data:image/jpg;base64,' + nodeimg(nodeimg(_confServer.tempPath+'/'+avatar), cropContext.left, cropContext.top, cropContext.width, cropContext.height).resize(100,100).encode('jpg', {operation:50}).toString('base64');
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE user SET avatar=? WHERE erp=?', [data, req.session.loginederp], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', avatar:data});
					} else {
						res.json({state:'fail'});
					}
					conn.release();
				});
			});
		}
	}
}