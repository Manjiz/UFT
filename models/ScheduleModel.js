var _conf = require('../conf.js')(),
	_confServer = require('../conf-server.js')(),
	mysql = require('../mysql'),
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
						+ 'user.erp, user.name, user.depID, '
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
								+ 'schedule.id, schedule.demandID, dictator, assignee, startDate, endDate, '
								+ 'demand.name as demandName '
								+ 'FROM schedule '
								+ 'LEFT JOIN demand ON demand.demandID = schedule.demandID '
								+ ' WHERE assignee=? ORDER BY startDate', [row.erp], function(err, rows, fields) {
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
	}
}