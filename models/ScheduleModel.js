var _confServer = require('../conf-server.js')(),
	mysql = require('./mysql'),
	pool = mysql.pool,
	
	async = require('async'),
	fs = require('fs'),

	nodemailer = require('nodemailer');

// 邮箱配置
var transporter = nodemailer.createTransport(_confServer.nodemailer);

/**
 * id demandID dictator assignee startDate endDate status
 */
exports.ScheduleModel = {
	/**
	 * ======================================================
	 *  获取当前周所有排期
	 * ======================================================
	 */
	getAllList: function(req, res) {
		pool.getConnection(function(err, conn) {
			async.waterfall([
				function getUsers(callback) {
					conn.query('SELECT '
						+ 'user.erp, user.name, user.depID, avatar, user.showMeInSchedule, '
						+ 'dep.name as depName '
						+ 'FROM user '
						+ 'LEFT JOIN dep ON user.depID = dep.id '
						+ 'WHERE user.status=0', function(err, rows, fields) {
						if(err) throw err;
						callback(null, rows)
					})
				},
				function getByUsers(rows, callback) {
					var tmpArr = [];
					var len = rows.length;
					async.forEachOf(rows, function(row, idx) {
						conn.query('SELECT '
								+ 'schedule.id, schedule.demandID, dictator, assignee, startDate, days, '
								+ 'demand.name as demandName, submitter '
								+ 'FROM schedule '
								+ 'LEFT JOIN demand ON demand.demandID = schedule.demandID '
								+ ' WHERE assignee=? ORDER BY startDate, days DESC', [row.erp], function(err, rows, fields) {
							if(err) throw err;
							row.data = rows;
							tmpArr.push(row);
							if(idx==len-1) {
								callback(err, tmpArr);
							}
						})
					})
				}
			], function completed(err, result) {
				res.json({state:'success', msg:'查找排期', data:JSON.stringify(result)});
				conn.release();
			})
		});
	},
	/**
	 * ======================================================
	 *  根据受理人找出TA的排期
	 * ======================================================
	 */
	getByAssignee: function(req, res) {
		pool.getConnection(function(err, conn) {
			var uerp = req.query.erp;
			conn.query('SELECT * FROM schedule WHERE assignee=?', [uerp], function(err, rows, fields) {
				if(err) throw err;
				res.json({state:'success', msg:'查找排期', data:JSON.stringify(rows)});
				conn.release();
			})
		});
	},
	update: function(req, res) {
		if(req.session.isAdmin) {
			pool.getConnection(function(err, conn) {
				var id = req.body.id,
					date = new Date(parseInt(req.body.date)),
					days = req.body.days,
					assignee = req.body.assignee;
				if(id && date!='Invalid Date') {
					if(days && /^[0-9]+$/.test(days) && days>0) {
						conn.query('UPDATE schedule SET startDate=?, days=? WHERE id=?', [date, days, id], function(err, result) {
							if(err) throw err;
							res.json({state:'success'})
							conn.release();
						});
					} else if(assignee) {
						conn.query('UPDATE schedule SET startDate=?, assignee=? WHERE id=?', [date, assignee, id], function(err, result) {
							if(err) throw err;
							res.json({state:'success'})
							conn.release();
						});
					} else {
						res.json({state:'fail', msg:'错误的排期天数'});
					}
				}
			});
		} else {
			res.json({state:'fail', msg:'你不是管理员'});
		}
	}
}