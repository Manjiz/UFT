var _confServer = require('../conf-server.js')(),
	mysql = require('../mysql'),
	pool = mysql.pool;

/**
 * 
 */
exports.BusinessModel = {
	/**
	 * ======================================================
	 *  添加业务类型
	 *  ! 仅限管理平台使用
	 *   @params name [parentID]
	 * ======================================================
	 */
	add: function(req, res) {
		var name = req.body.name,
			parentID = parseInt(req.body.parentID) || null;
		if(name) {
			pool.getConnection(function(err, conn) {
				conn.query('INSERT INTO business (name, parentID) VALUES (?,?)', [name, parentID], function(err, result) {
					if(err) throw err;
					res.json({state:'success', msg:'添加业务成功'});
					conn.release();
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	},
	/**
	 * ======================================================
	 *  删除业务类型
	 *  ! 仅限管理平台使用
	 *   @params id
	 * ======================================================
	 */
	del: function(req, res) {
		var id = parseInt(req.body.id);
		if(id) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE business SET status=1 WHERE id=?', [id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', id:id, msg:'删除业务成功'});
					} else {
						res.json({state:'fail', msg:'删除业务失败'});
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
	 *  业务类型清单
	 *	 历史原因，分成两个 list 了
	 * ======================================================
	 */
	list: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT b.id, b.name, b.parentID, p.name as parentName FROM business as b LEFT JOIN business as p ON b.parentID=p.id WHERE b.status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			});
		});
	},
	/**
	 * ======================================================
	 *  业务类型清单
	 *	 历史原因，分成两个 list 了
	 * ======================================================
	 */
	listForUser: function(req, res) {
		pool.getConnection(function(err, conn) {
			conn.query('SELECT business.id, business.name, pBusiness.name as parentID  FROM business LEFT JOIN business as pBusiness ON business.parentID=pBusiness.id WHERE business.status=0', function(err, rows, fields) {
				if(err) throw err;
				res.send(JSON.stringify(rows));
				conn.release();
			});
		});
	},
	/**
	 * ======================================================
	 *  更新业务类型
	 *  ! 仅限管理平台使用
	 *   @params id name [parentID]
	 * ======================================================
	 */
	update: function(req, res) {
		var id = parseInt(req.body.id),
			name = req.body.name,
			parentID = req.body.parentID || null;
		if(id && name) {
			pool.getConnection(function(err, conn) {
				conn.query('UPDATE business SET name=?, parentID=? WHERE id=?', [name, parentID, id], function(err, result) {
					if(err) throw err;
					if(result.affectedRows>0) {
						res.json({state:'success', id:id, msg:'更新业务成功'});
					} else {
						res.json({state:'fail', msg:'更新业务失败'});
					}
					conn.release();
				});
			});
		} else {
			res.json({state:'fail', msg:'参数缺失'});
		}
	}
}