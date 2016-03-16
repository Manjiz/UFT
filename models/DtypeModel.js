var _confServer = require('../conf-server.js')(),
	mysql = require('../mysql'),
	pool = mysql.pool;

/**
 * 
 */
exports.DtypeModel = {
	/**
	 * ======================================================
	 *  添加需求类型
	 *  ! 仅限管理平台使用
	 *   @params name
	 * ======================================================
	 */
	add: function(req, res) {
		var name = req.body.name;
		if(name) {
			pool.getConnection(function(err, conn) {
				conn.query('INSERT INTO dtype (name) VALUES (?)', [name], function(err, result) {
					if(err) throw err;
					res.json({state:'success', msg:'添加需求类型成功'});
					conn.release();
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	},
	/**
	 * ======================================================
	 *  删除需求类型
	 *  ! 仅限管理平台使用
	 *   @params id
	 * ======================================================
	 */
	del: function(req, res) {
		var id = parseInt(req.body.id);
		if(id) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE dtype SET status=1 WHERE id=?', [id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', id:id, msg:'删除需求类型成功'});
					} else {
						res.json({state:'fail', msg:'删除需求类型失败'});
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
	 *  需求类型清单
	 * ======================================================
	 */
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM dtype WHERE status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			});
		});
	},
	/**
	 * ======================================================
	 *  更新需求类型
	 *  ! 仅限管理平台使用
	 *   @params id name
	 * ======================================================
	 */
	update: function(req, res) {
		var id = parseInt(req.body.id),
			name = req.body.name;
		if(id && name) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE dtype SET name=? WHERE id=?', [name, id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', id:id, msg:'更新需求类型成功'});
					} else {
						res.json({state:'fail', msg:'更新需求类型失败'});
					}
					conn.release();
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	}
}