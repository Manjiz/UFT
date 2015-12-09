var _conf = require('../conf.js')(),
	_confServer = require('../conf-server.js')(),
	mysql = require('../mysql'),
	pool = mysql.pool,
	
	async = require('async'),
	fs = require('fs'),

	nodemailer = require('nodemailer'),
	nodeimg = require('images');

// 邮箱配置
var transporter = nodemailer.createTransport(_confServer.nodemailer);

/**
 * id erp email password name depID lastLogin token isAdmin regpid status
 */
exports.UserModel = {
	findbackList: [],

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
	updatePwd: function(req, res) {
		pool.getConnection(function(err, conn) {
			var reg_pwd = /.{6,8}/,
				oldpwd = req.body.oldpwd,
				newpwd = req.body.newpwd;
			if(reg_pwd.test(newpwd)) {
				conn.query('UPDATE user SET password=MD5(?) WHERE erp=? AND password=MD5(?) AND status=0', [newpwd, req.session.loginederp, oldpwd], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', msg:'密码修改成功'})
					} else {
						res.json({state:'fail', msg:'密码错误'})		
					}
				})
			} else {
				res.json({state:'fail', msg:'密码不符合要求'})
			}
		});
	},
	updateAvatar: function(req, res) {
		pool.getConnection(function(err, conn) {
			var avatar = req.body.avatar,
				cropContext = req.body.cropContext;
			//% upload/avatar 不存在时新建目录 %
			nodeimg(nodeimg('temp/'+avatar), cropContext.left, cropContext.top, cropContext.width, cropContext.height).resize(100,100).save('upload/avatar/'+avatar);
			// 保存到数据库的路径 'upload/avatar/'+avatar
			
		});
	}
}