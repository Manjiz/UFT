var _confServer = require('../conf-server.js')(),
	mysql = require('./mysql'),
	pool = mysql.pool,
	
	async = require('async'),
	fs = require('fs'),

	nodemailer = require('nodemailer');

// 邮箱配置
var transporter = nodemailer.createTransport(_confServer.nodemailer);

/**
 * filename demandid originalname mimetype uerp date download
 */
exports.FilesModel = {
	/**
	 * ======================================================
	 *  根据需求编号查找文件清单
	 * ======================================================
	 */
	getByDemandId: function(req, res) {
		pool.getConnection(function(err, conn) {
			var demandid = req.params.demandid;
			conn.query('SELECT * FROM demandfiles WHERE demandid=?', [demandid], function(err, rows, fields) {
				if(err) throw err;
				res.json({state:'success', msg:'查找文件清单成功', data:JSON.stringify(rows)});
				conn.release()
			})
		})
	}
}