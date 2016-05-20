var _confServer = require('../conf-server.js')(),
	mysql = require('./mysql'),
	pool = mysql.pool,
	
	async = require('async'),
	fs = require('fs'),
	util = require('util'),

	nodemailer = require('nodemailer'),
	request = require('request');

// 邮箱配置
var transporter = nodemailer.createTransport(_confServer.nodemailer);

/**
 * demandID dtype business name description ua state submitDate submitter executor executeDate solver solveMsg status
 */
exports.DemandModel = {
	/**
	 * ======================================================
	 *  需求申请提交
	 *	 @params dtype, business, name [,description, files, ua, executor]
	 * ======================================================
	 */
	add: function(req, res) {
		var submitter = req.session.erp,	//申请人
			demandID = new Date().toISOString().replace(/(\s)|T|(\..+)|:|-/g, ''),	//---20150918 064419
			dtype = req.query.dtype,			//需求类型
			business = req.query.business,		//业务名称
			name = req.query.name || null,		//需求名称
			executeDate = req.query.executeDate ? new Date(req.query.executeDate) : null,	//预期执行时间
			description = req.query.description || null,	//需求描述
			files = JSON.parse(req.query.files) || [],		//文件清单
			ua = req.query.ua || null,						//ua信息
			executor = req.query.executor || null,			//预期执行人
			filesForMySql = [];
		// 不能把完成时间定在今日之前
		executeDate = executeDate&&executeDate.getTime() > new Date().getTime() ? executeDate : null;
		// upload 文件夹不存在则新建
		fs.exists(_confServer.uploadPath, function(isExists) {
			if(!isExists) {
				fs.mkdir(_confServer.uploadPath);
			}
		});
		if(dtype && business && name && submitter) {
			pool.getConnection(function(err, conn) {
				conn.query('INSERT INTO demand (demandID, dtype, business, name, executeDate, description, ua, submitter, submitDate, executor) VALUES (?,?,?,?,?,?,?,?,?,?)', [
					demandID,
					dtype,
					business,
					name,
					executeDate,
					description,
					ua,
					submitter,
					new Date(),
					executor
				], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						// 把文件从temp转移到upload
						files.forEach(function(e, i, arr) {
							var src = fs.createReadStream(_confServer.tempPath + '/' + e.filename),
								dest = fs.createWriteStream(_confServer.uploadPath + '/' + e.filename);
							src.pipe(dest);
  							src.on('end', function() {
  								try{
									fs.unlink(_confServer.tempPath + '/' + e.filename, function(err) {
  										if(err) throw err;
  									});
  								} catch(e) {
  									console.log(e.message);
  								}
  							});
  							// src.on('error', function(err) {  });
  							filesForMySql.push({filename:e.filename, originalname: e.originalname, mimetype: e.mimetype, uerp:req.session.erp});
						})
						filesForMySql.forEach(function(e, i, arr) {
							conn.query('INSERT INTO demandfiles (filename, demandid, originalname, mimetype, uerp, date) VALUES (?,?,?,?,?,?)', [
								e.filename, demandID, e.originalname, e.mimetype, e.uerp, new Date()
							], function(err, result) {
								if(err) throw err;
							})
						})
						res.json({state:'success', msg:'添加需求成功', data:demandID})
					} else {
						conn.release();
						res.json({state:'fail', msg:'申请需求失败'});
					}
				});
			});
		} else if (!dtype) {
			res.json({state:'fail', msg:'需求类型不能为空'});
		} else if (!business) {
			res.json({state:'fail', msg:'业务类型不能为空'});
		} else if (!name) {
			res.json({state:'fail', msg:'需求名称不能为空'});
		} else if (!submitter) {
			res.json({state:'fail', msg:'未知提交人'});
		}
	},
	/**
	 * ======================================================
	 *  删除需求
	 *  ! 仅限管理平台使用
	 *   @params demandID
	 * ======================================================
	 */
	del: function(req, res) {
		var did = req.body.demandID;
		if(did) {
			pool.getConnection(function(err, conn) {
				conn.query('DELETE FROM demand WHERE demandID=?', [did], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', msg:'删除成功', demandID:did});
					} else {
						res.json({state:'fail', msg:'删除失败'});
					}
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	},
	/**
	 * ======================================================
	 *  按需求ID获取需求信息
	 *   @params demandID
	 * ======================================================
	 */
	get: function(req, res) {
		var id = req.query.demandID;
		if(id) {
			pool.getConnection(function(err, conn) {
				conn.query('SELECT '
					+ 'd.demandID, d.name, executeDate, description, ua, state, submitDate, solveDate, solveMsg, submitter, executor, solver, d.status, '
					+ 'dtype.name as dtypeName, '
					+ 'business.name as businessName, '
					+ 'us.name as submitterName, ue.name as executorName, uo.name as solverName, ua.name as assigneeName, ud.name as dictatorName, '
					+ 's.startDate, s.days, s.dictator, s.assignee '
					+ 'FROM demand as d '
				+ 'LEFT JOIN dtype ON d.dtype=dtype.id '
				+ 'LEFT JOIN business ON d.business=business.id '
				+ 'LEFT JOIN user as us ON d.submitter=us.erp '
				+ 'LEFT JOIN user as ue ON d.executor=ue.erp '
				+ 'LEFT JOIN user as uo ON d.solver=uo.erp '
				+ 'LEFT JOIN schedule as s ON d.demandID=s.demandID '
				+ 'LEFT JOIN user as ua ON ua.erp=s.assignee '
				+ 'LEFT JOIN user as ud ON ud.erp=s.dictator '
				+ 'WHERE d.demandID=?', [id], function(err, rows, fields) {
					if(err) throw err;
					if(rows.length>0) {
						res.json({state:'success', msg:'查找需求成功', data:JSON.stringify(rows)});
					} else {
						res.json({state:'fail', msg:'查无此需'});
					}
					conn.release();
				})
			});
		} else {
			res.json({state:'fail', msg:'需求编号不能为空'});
		}
	},
	/**
	 * ======================================================
	 *  找出我提交的需求 或 我是执行者的需求
	 * ======================================================
	 */
	getMyDemands: function(req, res) {
		var uerp = req.session.erp,
			state = req.params.state;
		if(state) {
			pool.getConnection(function(err, conn) {
				conn.query('SELECT '
					+ 'demand.demandID,demand.name,description,ua,state,submitDate,solveDate,solveMsg, submitter, executor, solver, '
					+ 'dtype.name as dtype, business.name as business, user_submitter.name as submitterName, user_executor.name as executorName, user_solver.name as solverName, demand.status as status FROM demand '
					
					+ 'LEFT JOIN dtype ON demand.dtype=dtype.id '
					+ 'LEFT JOIN business ON demand.business=business.id '
					+ 'LEFT JOIN user as user_submitter ON demand.submitter=user_submitter.erp '
					+ 'LEFT JOIN user as user_executor ON demand.executor=user_executor.erp '
					+ 'LEFT JOIN user as user_solver ON demand.solver=user_solver.erp '
					+ 'LEFT JOIN schedule ON schedule.demandID=demand.demandID '
					+ 'WHERE (demand.submitter=? OR demand.executor=? OR schedule.assignee=?) AND state=?'
					+ 'ORDER BY demand.submitDate', [uerp, uerp, uerp, state], function(err, rows, fields) {
						if(err) throw err;
						res.json({state:'success', msg:'查找需求成功', data:JSON.stringify(rows)});
						conn.release();
				})
			});
		} else {
			res.json({state:'fail', msg:'未指定需求状态'});
		}
	},
	/**
	 * ======================================================
	 *  获取需求列表（按提交时间）
	 * ======================================================
	 */
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT '
				+ 'demandID,demand.name,description,ua,state,submitDate,solveDate,solveMsg, submitter, executor, executeDate, solver, '
				+ 'demand.name, dtype.name as dtype, business.name as business, user_submitter.name as submitterName, user_executor.name as executorName, user_solver.name as solverName, demand.status as status FROM demand '
				+ 'LEFT JOIN dtype ON demand.dtype=dtype.id '
				+ 'LEFT JOIN business ON demand.business=business.id '
				+ 'LEFT JOIN user as user_submitter ON demand.submitter=user_submitter.erp '
				+ 'LEFT JOIN user as user_executor ON demand.executor=user_executor.erp '
				+ 'LEFT JOIN user as user_solver ON demand.solver=user_solver.erp '
				+ 'ORDER BY demand.submitDate' , function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			})
		});
	},
	/**
	 * ======================================================
	 *  获取未审核的需求的数量 - 用于导航栏通知
	 * ======================================================
	 */
	getNotAuditedCount: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT COUNT(*) FROM demand WHERE state=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(rows[0]);
				conn.release();
			})
		});
	},
	/**
	 * ======================================================
	 *  找出所有未审核需求 - 专为管理员服务
	 * ======================================================
	 */
	getNotAuditedDemands: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT '
				+ 'demandID,demand.name,description,ua,state,submitDate,solveDate,solveMsg, submitter, executor, solver, '
				+ 'demand.name, dtype.name as dtype, business.name as business, user_submitter.name as submitterName, user_executor.name as executorName, user_solver.name as solverName, demand.status as status FROM demand '
				
				+ 'LEFT JOIN dtype ON demand.dtype=dtype.id '
				+ 'LEFT JOIN business ON demand.business=business.id '
				+ 'LEFT JOIN user as user_submitter ON demand.submitter=user_submitter.erp '
				+ 'LEFT JOIN user as user_executor ON demand.executor=user_executor.erp '
				+ 'LEFT JOIN user as user_solver ON demand.solver=user_solver.erp '
				+ 'WHERE state=0 AND demand.status=0 '
				+ 'ORDER BY demand.submitDate', function(err, rows, fields) {
					if(err) throw err;
					res.json({state:'success', msg:'查找需求成功', data:JSON.stringify(rows)});
					conn.release();
				})
		});
	},
	/**
	 * ======================================================
	 *  需求审核
	 *   @params demandid, assignee, startDate, endDate
	 * ======================================================
	 */
	audited: function(req, res) {
		var demandid = req.body.demandID,
			handler = req.session.erp,
			assignee = req.body.assignee,
			startDate = req.body.startDate,
			endDate = req.body.endDate;
		if(req.session.isAdmin) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE demand SET state=1 WHERE demandID=? AND status=0', [demandid], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						var days = Math.floor(new Date(endDate).getTime()/86400000) - Math.floor(new Date(startDate).getTime()/86400000) + 1;
						conn.query('INSERT INTO schedule (demandID, dictator, assignee, startDate, days) VALUES (?,?,?,?,?)', [demandid, handler, assignee, new Date(startDate), days], function(err, result) {
							if(err) throw err;
							if(result.affectedRows>0) {
								demandStateEmail(demandid, handler+'审核通过了需求，请处理人受理', _confServer.returnUrl + '#/detail/'+demandid);
								res.json({state:'success', msg:'需求审核通过'});
							}
							conn.release();
						});
					} else {
						conn.release();
						res.json({state:'fail', msg:''});
					}
				});
			});
		} else {
			res.json({state:'fail', msg:'你不是管理员'});
		}
	},
	/**
	 * ======================================================
	 *  需求状态更改
	 * ======================================================
	 */
	changeState: function(req, res) {
		var demandid = req.query.demandID,
			handler = req.session.erp,
			type = req.query.type,
			solveMsg = req.query.solveMsg,
			designated = req.query.designated,
			files = req.query.files ? JSON.parse(req.query.files) : [],
			filesForMySql = [];
	
		// 文件从temp转移到upload
		files.forEach(function(e, i, arr) {
			var src = fs.createReadStream(_confServer.tempPath + '/' + e.filename),
				dest = fs.createWriteStream(_confServer.uploadPath + '/' + e.filename);
			src.pipe(dest);
  			src.on('end', function() { });
  			src.on('error', function(err) {  });
  			filesForMySql.push({filename:e.filename, originalname: e.originalname, mimetype: e.mimetype, uerp:req.session.erp});
		})
		if(filesForMySql.length>0 && demandid && type) {
			pool.getConnection(function(err, conn) {
				filesForMySql.forEach(function(e, i, arr) {
					conn.query('INSERT INTO demandfiles (filename, demandid, originalname, mimetype, uerp, date) VALUES (?,?,?,?,?,?)', [
						e.filename, demandid, e.originalname, e.mimetype, e.uerp, new Date()
					], function(err, result) {
						if(err) throw err;
					})
				})
			});
		}
	
		// 格式化指派的处理说明（即必会带上）
		if(type && type=='designated') {solveMsg = '指派'+(designated || '不限制')+'：'+solveMsg;}
		solveMsg = JSON.stringify({
			uerp: handler,
			date: new Date(),
			cont: solveMsg || '',
			type: type,
			files: files
		})+',';
		if(demandid && type) {
			pool.getConnection(function(err, conn) {
				if (type=='closed') {
					// 验证管理员身份
					conn.query('SELECT * FROM user WHERE erp=? AND isAdmin=1 AND status=0', [handler], function(err, rows, fields) {
						if(err) throw err;
						if(rows.length>0) {
							console.log('>>> \x1b[36mdemand/closed\x1b[0m::管理员身份验证通过');
							conn.query('UPDATE demand SET state=4, solveMsg=CONCAT_WS("", solveMsg, ?), solver=? WHERE demandID=?', [solveMsg, handler, demandid], function(err, result) {
								if(err) throw err;
								if(result.affectedRows>0) {
									demandStateEmail(demandid, '需求被'+handler+'关闭，周知', _confServer.returnUrl + '#/detail/'+demandid);
									console.log('>>> \x1b[36mdemand/closed\x1b[0m::需求关闭成功');
									res.json({state:'success', msg:'需求已关闭'});
								}
								conn.release();
							})
						} else {
							// 验证是否是提交者
							conn.query('SELECT submitter FROM demand WHERE submitter=? AND demandID=?', [handler, demandid], function(err, rows, fields) {
								if(err) throw err;
								if(rows.length>0) {
									console.log('>>> \x1b[36mdemand/closed\x1b[0m::提交者身份验证通过');
									conn.query('UPDATE demand SET state=4, solveMsg=CONCAT_WS("", solveMsg, ?), solver=? WHERE demandID=?', [solveMsg, handler, demandid], function(err, result) {
										if(err) throw err;
										if(result.affectedRows>0) {
											demandStateEmail(demandid, '需求被'+handler+'关闭，周知', _confServer.returnUrl + '#/detail/'+demandid);
											console.log('>>> \x1b[36mdemand/closed\x1b[0m::需求关闭成功');
											res.json({state:'success', msg:'需求已关闭'});
										}
										conn.release();
									})
								} else {
									conn.release();
								}
							})
						}
					})
				} else if (type=='reopen') {
					// 验证管理员身份
					conn.query('SELECT * FROM user WHERE erp=? AND isAdmin=1 AND status=0', [handler], function(err, rows, fields) {
						if(err) throw err;
						if(rows.length>0) {
							console.log('>>> \x1b[36mdemand/reopen\x1b[0m::管理员身份验证通过');
							conn.query('UPDATE demand SET state=1, solveMsg=CONCAT_WS("", solveMsg, ?), solver=? WHERE demandID=?', [solveMsg, handler, demandid], function(err, result) {
								if(err) throw err;
								if(result.affectedRows>0) {
									demandStateEmail(demandid, '需求被'+handler+'重启，周知', _confServer.returnUrl + '#/detail/'+demandid);
									console.log('>>> \x1b[36mdemand/reopen\x1b[0m::需求重启成功');
									res.json({state:'success', msg:'需求已重启'});
								}
								conn.release();
							})
						} else {
							// 验证是否是提交者
							conn.query('SELECT submitter FROM demand WHERE submitter=? AND demandID', [handler, demandid], function(err, rows, fields) {
								if(err) throw err;
								if(rows.length>0) {
									console.log('>>> \x1b[36mdemand/reopen\x1b[0m::提交者身份验证通过');
									conn.query('UPDATE demand SET state=1, solveMsg=CONCAT_WS("", solveMsg, ?), solver=? WHERE demandID=?', [solveMsg, handler, demandid], function(err, result) {
										if(err) throw err;
										if(result.affectedRows>0) {
											demandStateEmail(demandid, '需求被'+handler+'重启，周知', _confServer.returnUrl + '#/detail/'+demandid);
											console.log('>>> \x1b[36mdemand/reopen\x1b[0m::需求重启成功');
											res.json({state:'success', msg:'需求已重启'});
										}
										conn.release();
									})
								} else {
									conn.release();
								}
							})
						}
					})
				} else if (type=='solving') {
					conn.query('SELECT executor FROM demand WHERE demandID=?', [demandid], function(err, rows, fields) {
						if(err) throw err;
						if(rows.length>0) {
							if(!rows[0].executor || rows[0].executor==handler) {	// 如果不限制执行人 或 当前就是执行人
								console.log('>>> \x1b[36mdemand/solving\x1b[0m::执行人身份验证通过');
								// 非未审核或已关闭的需求 设置为处理中
								conn.query('UPDATE demand SET state=2, solveMsg=CONCAT_WS("", solveMsg, ?), solver=? WHERE demandID=? AND state<>0 AND state<>4', [solveMsg, handler, demandid], function(err, result) {
									if(err) throw err;
									if(result.affectedRows>0) {
										demandStateEmail(demandid, '需求已被'+handler+'受理', _confServer.returnUrl + '#/detail/'+demandid);
										console.log('>>> \x1b[36mdemand/solving\x1b[0m::需求处理中');
										res.json({state:'success', msg:'需求处理中'});
									}
									conn.release();
								})
							} else {
								conn.release();
							}
						} else {
							conn.release();
						}
					})
				} else if (type=='solved') {
					conn.query('SELECT executor FROM demand WHERE demandID=?', [demandid], function(err, rows, fields) {
						if(err) throw err;
						if(rows.length>0) {
							if(!rows[0].executor || rows[0].executor==handler) {	// 如果不限制执行人 或 当前就是执行人
								console.log('>>> \x1b[36mdemand/solved\x1b[0m::执行人身份验证通过');
								// 非未审核或已关闭的需求 设置为处理完成
								conn.query('UPDATE demand SET state=3, solveMsg=CONCAT_WS("", solveMsg, ?), solver=?, solveDate=? WHERE demandID=? AND state<>0 AND state<>4', [solveMsg, handler, new Date, demandid], function(err, result) {
									if(err) throw err;
									if(result.affectedRows>0) {
										demandStateEmail(demandid, handler+'已完成需求', _confServer.returnUrl + '#/detail/'+demandid);
										console.log('>>> \x1b[36mdemand/solved\x1b[0m::需求处理完成');
										res.json({state:'success', msg:'需求处理完成'});
									}
									conn.release();
								})
							} else {
								conn.release();
							}
						} else {
							conn.release();
						}
					})
				} else if(type=='designated') {
					// 验证管理员身份
					conn.query('SELECT * FROM user WHERE erp=? AND isAdmin=1 AND status=0', [handler], function(err, rows, fields) {
						if(err) throw err;
						function update() {
							// 验证该执行人是否存在
							conn.query('SELECT * FROM user WHERE erp=? AND status=0', [designated], function(err, rows, fields) {
								if(err) throw err;
								if(rows.length>0 || !designated) {	//未指派或找到该erp
									// 执行更新操作
									conn.query('UPDATE demand SET solveMsg=CONCAT_WS("", solveMsg, ?), solver=?, executor=? WHERE demandID=?', [solveMsg, handler, designated, demandid], function(err, result) {
										if(err) throw err;
										if(result.affectedRows>0) {
											demandStateEmail(demandid, handler+'指派'+designated, _confServer.returnUrl + '#/detail/'+demandid);
											console.log('>>> \x1b[36mdemand/designated\x1b[0m::需求指派成功');
											res.json({state:'success', msg:'需求指派成功'});
										}
										conn.release();
									})
								} else {
									conn.release();
								}
							})
						}
						if(rows.length>0) {
							console.log('>>> \x1b[36mdemand/designated\x1b[0m::管理员身份验证通过');
							update();
						} else {
							// 验证是否是当前的执行人（执行人想换个执行人）
							conn.query('SELECT executor FROM demand WHERE executor=? AND demandID=?', [handler, demandid], function(err, rows, fields) {
								if(err) throw err;
								if(rows.length>0) {
									console.log('>>> \x1b[36mdemand/designated\x1b[0m::提交者身份验证通过');
									update();
								}
							})
						}
					})
				}
			});
		}
	},
	/**
	 * ======================================================
	 *  前十需求提交者
	 * ======================================================
	 */
	getTopSubmitter: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT '
					+ 'submitter, user.name as submitterName, COUNT(*) AS count '
					+ 'FROM demand '
					+ 'LEFT JOIN user ON demand.submitter = user.erp '
					+ 'GROUP BY submitter ORDER BY count DESC LIMIT 10', function(err, rows, result) {
				if(err) throw err;
				res.send(rows);
				conn.release();
			})
		});
	}
}

function demandStateEmail(demandid, stateName, url) {
	pool.getConnection(function(err, conn) {
		conn.query('SELECT '
				+ 'demandID, submitter, executor, solver, state, '
				+ 'demand.name as name, user_submitter.name as submitterName, user_executor.name as executorName, user_submitter.email as semail, user_executor.email as eemail '
				+ 'FROM demand '
				+ 'LEFT JOIN user as user_submitter ON demand.submitter=user_submitter.erp '
				+ 'LEFT JOIN user as user_executor ON demand.executor=user_executor.erp '
				+ 'WHERE demandID=?', [demandid], function(err, rows, fields) {
			if(err) throw err;
			if(rows.length>0) {
				var submitter = rows[0].submitter,
					submitterEmail = rows[0].semail,
					executor = rows[0].executor,
					executorEmail = rows[0].eemail,
					demandid = rows[0].demandID,
					name = rows[0].name;
				// 发送周知邮件
				console.log('>>> \x1b[36mdemand/xxx\x1b[0m::需求周知邮件准备发送');
				// transporter.sendMail({
				// 		from: 'JDC多终端研发部<jdc_fd@163.com>',
				//     	to: submitterEmail +';'+ executorEmail,
				//     	subject: '【需求周知】'+name,
				//     	html: emailTpl.replace('{{submitter}}', submitter).replace('{{name}}', name).replace('{{stateName}}', stateName).replace('{{url}}', url),
				// 	}, function(error, info){
				//     	if(error){
				//     	    return console.log(error);
				//     	}
				//     	console.log('Message sent: ' + info.response);
				//     	console.log('>>> \x1b[36mdemand/xxx\x1b[0m::邮件周知已发送');
				// });
				request.post({
					url: 'http://ecp.jd.com/api/send_msg_uft.php?act=sendmailer',
					form: {
						subject: name,
						receiver: submitterEmail +';'+ executorEmail,
						message: emailTpl.replace('{{submitter}}', submitter).replace('{{name}}', name).replace('{{stateName}}', stateName).replace('{{url}}', url)
					}
				}, function(err,httpResponse,body) {
					console.log(body);
					if(body==1) {
						console.log('>>> \x1b[36mdemand/xxx\x1b[0m::邮件周知已发送');
					}
				})
			}
			conn.release();
		})
	});
}

var emailTpl = '<div style="text-align: center;color: #333;line-height: 40px;font-size: 12px;">此邮件乃自动发送，请勿直接回复</div>'
				+'<div style="width: 640px;margin: 0 auto;background-color: #fff;">'
					+'<div style="text-align: center;color: #000;font-size: 22px;padding: 20px 0;border-bottom: 1px dashed #DDDDDD;margin: 0 20px;">'
						+'<img src="http://labs.qiang.it/tools/pp/upload/20151220-1634.png" alt="" style="display: block;margin: 0 auto;">'
					+'</div>'
					+ '<div class="bd" style="text-align: center;border-top: 0px none;line-height: 30px;padding: 30px;">'
						+'<div class="dear" style="font-size: 14px;"><b>{{submitter}}</b>，您好！</div>'	//{{submitter}}
						+'<div class="cnt" style="margin-bottom: 20px;font-size: 14px;">需求：<b style="margin: 0 5px;">{{name}}</b>最新状态<b style="margin: 0 5px;">{{stateName}}</b>。</div>'	//{{name}} {{stateName}}
						+'<div class="cnt" style="margin-bottom: 20px;font-size: 12px;"><br></div>'
						+'<a href="{{url}}" class="btn" style="display: block;width: 100px;height: 30px;line-height: 30px;text-align: center;margin: 0 auto;color: #fff;background-color: #FF3344;text-decoration: none;font-size: 12px;">点此查看详情</a>'	//{{url}}
					+'</div>'
				+'</div>';