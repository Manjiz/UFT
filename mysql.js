var mysql = require('mysql'),
	async = require('async'),
	fs = require('fs');

var pool = exports.pool = mysql.createPool({
	// acquireTimeout: 10000,
	// waitForConnections: true|false,
	// queueLimit: 0,
	connectionLimit: 10,
	host: 'localhost',
	user: 'root',
	password: '',
	database : 'uft',
	charset : 'utf8_general_ci'
})

// var conn = exports.conn = mysql.createConnection({
// 	host : 'localhost',
// 	user : 'root',
// 	password : '',
// 	database : 'uft',
// 	charset : 'utf8_general_ci'
// });

// conn.connect();

// conn.on('error', function(err) {
// 	console.log(err.code)
// })

// %请验证传参是否为空%
// %具体化错误%

exports.admin = {
	add: function(req, res) {
		pool.getConnection(function(err, conn) {
			var user = req.query.user,
				password = req.query.password;
			conn.query('SELECT * FROM admin WHERE user=?', [user], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					res.json({state: 'fail', msg: '管理员已存在'});
					conn.release();
				} else {
					conn.query('INSERT INTO admin (user, password) VALUES (?,MD5(?))', [user, password], function(err, result) {
						if(err) throw err;
						res.json({state: 'success', msg: '添加管理员成功'});
						conn.release();
					})
				}
			})
		});
	},
	login: function(req, res) {
		pool.getConnection(function(err, conn) {
			var user = req.query.user,
				password = req.query.password;
			conn.query('SELECT * FROM admin WHERE user=? and password=MD5(?) and status=0', [user, password], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					conn.query('UPDATE admin SET lastLogin=? WHERE user=?', [new Date(), user], function(err, result) {
						if(err) throw err;
						req.session.uid = user;
						res.json({state: 'success', msg: '登录成功'});
						conn.release();
					})
				} else {
					res.json({state: 'fail', msg: '登录失败'});
					conn.release();
				}
			})
		});
	},
	del: function(req, res) {
		pool.getConnection(function(err, conn) {
			var user = req.query.user;
			conn.query('UPDATE admin SET status=1 WHERE user=?', [user], function(err, result) {
				if(err) throw err;
				if(result.affectedRows>0) {
					res.json({state: 'success', msg: '成功删除管理员'})
				}
				conn.release();
			})
		});
	}
}

exports.user = {
	/**
	 * erp email password name [depID]
	 */
	reg: function(req, res, isChecked, pid) {
		pool.getConnection(function(err, conn) {
			var erp = req.query.erp,
				email = req.query.email,
				password = req.query.password,
				name = req.query.name,
				depID = req.query.depID || null;
			console.log('reg::----------');
			conn.query('SELECT * FROM user WHERE erp=? AND status=0', [erp], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					res.json({state: 'fail', msg: '用户已存在'});
					conn.release();
				} else {
					// 先删除已关闭的用户
					conn.query('DELETE FROM user WHERE erp=?', [erp], function(err, result) {
						if(err) throw err;
						console.log('reg::delete');
						// 再执行插入操作
						if(!isChecked) {
							conn.query('INSERT INTO user (erp, email, password, name, depID, regpid, status) VALUES (?,?,MD5(?),?,?,?,?)', [erp, email, password, name, depID, pid, 1], function(err, result) {
								if(err) throw err;
								console.log('reg::rawadd');
								res.json({state: 'success', msg: '添加用户成功，等待用户邮箱验证'});
								conn.release();
							})
						} else {
							conn.query('SELECT * FROM user WHERE regpid=?', [pid], function(err, rows, fields) {
								if(rows.length>0) {
									conn.query('UPDATE user SET regpid=?, status=? WHERE regpid=?', [null, 0, pid], function(err, result) {
										if(err) throw err;
										console.log('reg::update');
										// res.json({state: 'success', msg: '添加用户成功，邮箱已验证'});
										req.session.logined = rows[0].id;	// session
										req.session.loginederp = rows[0].erp;	// session
										req.session.isAdmin  = rows[0].isAdmin;
										res.redirect('../../../state.html#checksucc');
										conn.release();
									})
								} else {
									res.redirect('../../../state.html#checkfail');
									conn.release();
								}
							})
						}
					})
				}
			})
		});
	},
	add: function(req, res) {
		pool.getConnection(function(err, conn) {
			var erp = req.query.erp,
				email = req.query.email,
				password = req.query.password,
				name = req.query.name,
				depID = req.query.depID || null;
			if(erp && email && password && name) {
				conn.query('SELECT * FROM user WHERE erp=?', [erp], function(err, rows, fields) {
					if(err) throw err;
					if(rows.length>0) {
						res.json({state: 'fail', msg: '用户已存在'});
						conn.release();
					} else {
						conn.query('INSERT INTO user (erp, email, password, name, depID) VALUES (?,?,MD5(?),?,?)', [erp, email, password, name, depID], function(err, result) {
							if(err) throw err;
							res.json({state: 'success', msg: '添加用户成功'});
							conn.release();
						})
					}
				})
			} else {
				res.json({state:'fail', msg:'用户名/ERP/email/密码 不能为空'});
				conn.release();
			}
		});
	},
	login: function(req, res) {
		pool.getConnection(function(err, conn) {
			var erp = req.query.erp,	// %另，邮箱登录%
				password = req.query.password;
			conn.query('SELECT * FROM user WHERE erp=? AND password=? AND status=0', [erp, password], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					req.session.logined = rows[0].id;	// session
					req.session.loginederp = rows[0].erp;	// session
					req.session.isAdmin  = rows[0].isAdmin;
					conn.query('UPDATE user SET lastLogin=? WHERE erp=?', [new Date(), erp], function(err, result) {
						if(err) throw err;
						res.json({state: 'success', msg: '登录成功', data:rows[0]});
						conn.release();
					})
				} else {
					res.json({state: 'fail', msg: '登录失败'});	// %还没具体到密码还是用户错误%
					conn.release();
				}
			})
		});
	},
	del: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = req.query.id;
			conn.query('UPDATE user SET status=1 WHERE id=?', [id], function(err, result) {
				if(err) throw err;
				if(result.affectedRows>0) {
					res.json({state: 'success', msg: '删除用户成功'})
				}
				conn.release();
			})
		});
	},
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT user.id, user.name, user.erp, CONCAT(user.name,"(", user.erp, ")") as nameConcatErp, user.email, dep.name as depName, user.depID FROM user LEFT JOIN dep ON user.depID=dep.id WHERE user.status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			})
		});
	},
	// id name erp email [depID]
	update: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = parseInt(req.query.id),
				name = req.query.name,
				erp = req.query.erp,
				email = req.query.email,
				depID = req.query.depID || null,
				isAdmin = req.query.isAdmin || 0;
			if(id && name && erp && email) {
				conn.query('UPDATE user SET name=?, erp=?, email=?, depID=?, isAdmin=? WHERE id=?', [name, erp, email, depID, isAdmin, id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', msg:'更新用户信息成功'});
					}
					conn.release();
				})
			} else {
				conn.release();
			}
		});
	}
}

exports.device = {
	add: function(req, res) {
		pool.getConnection(function(err, conn) {
			var name = req.query.name,
				owner = req.query.owner;
			conn.query('INSERT INTO device (name, owner) VALUES (?,?)', [name, owner], function(err, result) {
				if(err) throw err;
				res.json({state: 'success', msg: '添加设备成功'});
				conn.release();
			})
		});
	}
}

exports.dep = {
	add: function(req, res) {
		pool.getConnection(function(err, conn) {
			var name = req.query.name,
				depType = req.query.depType;
			conn.query('SELECT * FROM dep WHERE name=?', [name], function(err, rows, fields) {
				if(err) throw err;
				if(rows.length>0) {
					res.json({state:'fail', msg:'部门已存在'});
					conn.release();
				} else {
					conn.query('INSERT INTO dep (name, depType) VALUES (?,?)', [name, depType], function(err, result) {
						if(err) throw err;
						res.json({state: 'success', msg: '添加部门成功'});
						conn.release();
					})
				}
			})
		});
	},
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM dep WHERE status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			})
		});
	},
	del: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = req.query.id;
			conn.query('UPDATE dep SET status=1 WHERE id=?', [id], function(err, result) {
				if(err) throw err;
				if(result.affectedRows>0) {
					res.json({state:'success', msg:'删除部门成功'});
				}
				conn.release();
			})
		});
	},
	// id name [depType]
	update: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = parseInt(req.query.id),
				name = req.query.name,
				depType = req.query.depType || null;
			if(id && name) {
				conn.query('UPDATE dep SET name=?, depType=? WHERE id=?', [name, depType, id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', msg:'更新部门信息成功'});
					}
					conn.release();
				})
			} else {
				conn.release();
			}
		});
	}
}

exports.business = {
	// name [parentID]
	add: function(req, res) {
		pool.getConnection(function(err, conn) {
			var name = req.query.name,
				parentID = req.query.parentID || null;
			conn.query('INSERT INTO business (name, parentID) VALUES (?,?)', [name, parentID], function(err, result) {
				if(err) throw err;
				res.json({state:'success', msg:'添加业务成功'});
				conn.release();
			})
		});
	},
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM business WHERE status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			})
		});
	},
	listForUser: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT business.id as id, business.name as name, pBusiness.name as parentID  FROM business LEFT JOIN business as pBusiness ON business.parentID=pBusiness.id WHERE business.status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			})
		});
	},
	del: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = req.query.id;
			conn.query('UPDATE business SET status=1 WHERE id=?', [id], function(err, result) {
				if(err) throw err;
				if(result.affectedRows>0) {
					res.json({state:'success', msg:'删除业务成功'});
				}
				conn.release();
			})
		});
	},
	// id name [parentID]
	update: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = parseInt(req.query.id),
				name = req.query.name,
				parentID = req.query.parentID || null;
			if(id && name) {
				console.log(name, parentID, id)
				conn.query('UPDATE business SET name=?, parentID=? WHERE id=?', [name, parentID, id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', msg:'更新业务成功'});
					}
					conn.release();
				})
			} else {
				conn.release();
			}
		});
	}
}

exports.dtype = {
	add: function(req, res) {
		pool.getConnection(function(err, conn) {
			var name = req.query.name;
			conn.query('INSERT INTO dtype (name) VALUES (?)', [name], function(err, result) {
				if(err) throw err;
				res.json({state:'success', msg:'添加需求类型成功'});
				conn.release();
			})
		});
	},
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM dtype WHERE status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			})
		});
	},
	del: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = req.query.id;
			conn.query('UPDATE dtype SET status=1 WHERE id=?', [id], function(err, result) {
				if(err) throw err;
				if(result.affectedRows>0) {
					res.json({state:'success', msg:'删除需求类型成功'});
				}
				conn.release();
			})
		});
	},

	// id name
	update: function(req, res) {
		pool.getConnection(function(err, conn) {
			var id = parseInt(req.query.id),
				name = req.query.name;
			if(id && name) {
				conn.query('UPDATE dtype SET name=? WHERE id=?', [name, id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', msg:'更新需求类型成功'});
					}
					conn.release();
				})
			} else {
				conn.release();
			}
		});
	}
}

exports.demand = {
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			// 多表查询
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
	get: function(req, res) {
		pool.getConnection(function(err, conn) {
			var isAdmin = false,
				id = req.query.demandID,
				erp = req.session.loginederp;
			if(id) {
				conn.query('SELECT * FROM user WHERE erp=? AND isAdmin=? AND status=?', [erp, 1, 0], function(err, rows, fields) {
					if(err) throw err;
					if(rows.length>0) {
						isAdmin = true;
					}
					conn.query('SELECT '
						+ 'd.demandID, d.name, executeDate, description, ua, state, submitDate, solveDate, solveMsg, submitter, executor, solver, d.status, '
						+ 'dtype.name as dtypeName, '
						+ 'business.name as businessName, '
						+ 'us.name as submitterName, ue.name as executorName, uo.name as solverName, '
						+ 's.startDate, s.endDate, s.dictator, s.assignee '
						+ 'FROM demand as d '
					+ 'LEFT JOIN dtype ON d.dtype=dtype.id '
					+ 'LEFT JOIN business ON d.business=business.id '
					+ 'LEFT JOIN user as us ON d.submitter=us.erp '
					+ 'LEFT JOIN user as ue ON d.executor=ue.erp '
					+ 'LEFT JOIN user as uo ON d.solver=uo.erp '
					+ 'LEFT JOIN schedule as s ON d.demandID=s.demandID '
					+ 'WHERE d.demandID=?', [id], function(err, rows, fields) {
						if(err) throw err;
						if(rows.length>0) {
							res.json({state:'success', msg:'查找需求成功', data:JSON.stringify(rows), isAdmin: isAdmin});
						} else {
							res.json({state:'fail', msg:'查无此需'});
						}
						conn.release();
					})
				})
			} else {
				res.json({state:'fail', msg:'需求编号不能为空'});
				conn.release();
			}
		});
	},
	update: function(req, res) {
		pool.getConnection(function(err, conn) {
			var demandID = req.query.demandID,
				state = req.query.state,
				solveDate = new Date(),
				solver = req.session.loginederp,
				originalMsg = req.query.originalMsg,
				solveMsg = originalMsg + '--------------------<br>'+req.session.loginederp+'&nbsp;&nbsp;&nbsp;&nbsp;'+solveDate.toLocaleString()+'<br>'+req.query.solveMsg+'<br>';
			conn.query('UPDATE demand SET state=?,solveMsg=?,solveDate=?,solver=? WHERE demandID=?', [state, solveMsg, solveDate, solver, demandID], function(err, result) {
				if(err) throw err;
				res.json({state:'success', msg:'更新需求成功', data:demandID});
				conn.release();
			});
		});
	}
}

exports.statistics = {
	add: function(user) {
		pool.getConnection(function(err, conn) {
			conn.query('INSERT INTO statistics (user, theDate) VALUES (?,?)', [user, new Date()], function(err, result) {
				if(err) throw err;
				conn.release();
			})
		});
	}
}