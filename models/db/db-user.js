var mysql = require('../mysql'),
	pool = mysql.pool,
	async = require('async');

exports.dbuser = {
	add: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM user WHERE erp=? AND status=0', [erp], function(err, rows, fields) {
				
			});
		});
	}
}