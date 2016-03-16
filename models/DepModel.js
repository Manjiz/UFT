var _confServer = require('../conf-server.js')(),
	mysql = require('../mysql'),
	pool = mysql.pool;

/**
 * 
 */
exports.DepModel = {
	/**
	 * ======================================================
	 *  添加部门
	 *  ! 仅限管理平台使用
	 *   @params id
	 * ======================================================
	 */
	add: function(req, res) {
		var name = req.body.name,
			depType = req.body.depType || null;
		if(name) {
			pool.getConnection(function(err, conn) {
				conn.query('INSERT INTO dep (name, depType) VALUES (?,?)', [name, depType], function(err, result) {
					if(err) throw err;
					res.json({state: 'success', msg: '添加部门成功'});
					conn.release();
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	},
	/**
	 * ======================================================
	 *  删除部门
	 *  ! 仅限管理平台使用
	 *   @params id
	 * ======================================================
	 */
	del: function(req, res) {
		var id = parseInt(req.body.id);
		if(id) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE dep SET status=1 WHERE id=?', [id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', id:id, msg:'删除部门成功'});
					} else {
						res.json({state:'fail', msg:'删除部门失败'});
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
	 *  部门列表
	 * ======================================================
	 */
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT * FROM dep WHERE status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			});
		});
	},
	/**
	 * ======================================================
	 *  更新部门信息
	 *  ! 仅限管理平台使用
	 *   @params id name [depType]
	 * ======================================================
	 */
	update: function(req, res) {
		var id = parseInt(req.body.id),
			name = req.body.name,
			depType = req.body.depType || null;
		if(id && name) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE dep SET name=?, depType=? WHERE id=?', [name, depType, id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', id:id, msg:'更新部门信息成功'});
					} else {
						res.json({state:'fail', msg:'更新失败'});
					}
					conn.release();
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	}
}