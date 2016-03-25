var _confServer = require('./conf-server.js')(),
	fs = require('fs'),
	http = require('http'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	schedule = require('node-schedule'),
	session = require('express-session'),
	multer = require('multer'),
	morgan = require('morgan'),
	request = require('request');

	uploader = multer({
		// dest: _confServer.tempPath
		storage: multer.diskStorage({
			destination: function(req, file, cb) {
				cb(null, _confServer.tempPath)
			},
			filename: function(req, file, cb) {
				var now = new Date();
				cb(null, now.getFullYear() + 
						('0' + (now.getMonth()+1)).slice(-2) + 
						('0' + now.getDate()).slice(-2) + 
						('0' + now.getHours()).slice(-2) + 
						('0' + now.getMinutes()).slice(-2) + 
						('0' + now.getSeconds()).slice(-2) + 
						('0' + Math.floor(Math.random()*100)).slice(-2)
					)
			}
		})
	}),

	express = require('express'),
	app = express(),
	mysql = require('./mysql.js'),

	nodemailer = require('nodemailer'),
	transporter = nodemailer.createTransport(_confServer.nodemailer),
	md5 = require('./md5').md5,
	EMAIL_SECRET_KEY = 'jdcmobile',

	_demandModel = require('./models/DemandModel.js').DemandModel,
	_userModel = require('./models/UserModel.js').UserModel,
	_scheduleModel = require('./models/ScheduleModel.js').ScheduleModel,
	_filesModel = require('./models/FilesModel.js').FilesModel,
	_depModel = require('./models/DepModel.js').DepModel,
	_dtypeModel = require('./models/DtypeModel.js').DtypeModel,
	_businessModel = require('./models/BusinessModel.js').BusinessModel;

/*-----------------------
   定期任务 -/24h
    - 清除临时文件夹中最近访问时间在3天前的文件
    - 清空找回密码的临时数组
 ------------------------*/
schedule.scheduleJob('* * */24 * * *', function() {
	var fileList = [],
		folderList = [],
		walk = function(path, fileList, folderList) {
			fs.readdir(path, function(err, files) {
				if(err) throw err;
				files.forEach(function(item) {
					var tmpPath = path + '/' + item,
						stats = fs.statSync(tmpPath);
					if(stats.isDirectory()) {
						walk(tmpPath, fileList, folderList);
						folderList.push(tmpPath);
					} else {
						fileList.push(tmpPath);
						fs.stat(tmpPath, function(err, stats) {
							if(err) throw err;
							// 访问时间在3天前的文件
							if(new Date( new Date().getTime()-86400000*3 ) > stats.atime) {
								try {
									fs.unlink(tmpPath, function(err) {
										if(err) throw err;
									})
								} catch(e) {
									console.error(e.message);
								}
							}
						})
					}
				})
			})
		};
	console.log('File System::' + ' Automatically delete files...');
	walk(_confServer.tempPath, fileList, folderList);

	console.log('User Findback List::' + ' Automatically clear array...');
	_userModel.findbackList = [];
});

/*-----------------------
   中间件
 ------------------------*/
	app.use(session({
		secret: 'uft2015bymanjiz',
		cookie: {maxAge: 1000*60*60*24*15},	// 15 days
		resave: true,
	    saveUninitialized: true
	}));
	app.use(cookieParser());
	// 解析POST请求参数必需
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	// 调试模式
	app.use(morgan('dev', {
		skip: function(req, res) {
			return !/api/.test(req.originalUrl);
			// return res.statusCode < 400;
		}
	}));
	

/*-----------------------
   身份验证
 ------------------------*/
app.get(/admin2/, function(req, res, next) {
	if(req.session.erp && req.session.isAdmin) {
		next();
	} else {
		res.sendStatus(401);
	}
});

// app.get('/api', function(req, res, next) {
// 	if(req.session.erp) {
// 		next();
// 	} else {
// 		res.sendStatus(401);
// 	}
// })

// 发现这几行只能放在身份验证后面
app.use(express.static(__dirname + '/bughound'));
app.use('/upload', express.static(__dirname+'/'+_confServer.uploadPath));
app.use('/temp', express.static(__dirname+'/'+_confServer.tempPath));
app.use('/attachment/upload', express.static(__dirname+'/'+_confServer.uploadPath));


/*-----------------------
   API
 ------------------------*/
function requireAuth(req, res, next) {
	if(req.session.erp) {
		next();
	} else {
		res.sendStatus(401);
	}
}
//-----demand-----
	/* 添加需求 */
	app.get('/api/demand/add', requireAuth, function(req, res) { _demandModel.add(req, res) });
	/* 删除需求 */
	app.post('/api/demand/del', requireAuth, function(req, res) { _demandModel.del(req, res) });
	/* 获取需求 */
	app.get('/api/demand/get', function(req, res) { _demandModel.get(req, res) });
	/* 需求列表 */
	app.get('/api/demand/list', function(req, res) { _demandModel.list(req, res) });
	/* 我的需求 */
	app.get('/api/demand/getmydemands/:state', requireAuth, function(req, res) { _demandModel.getMyDemands(req, res) });
	/* 更改状态 */
	app.get('/api/demand/changestate', requireAuth, function(req, res) { _demandModel.changeState(req, res) });
	app.post('/api/demand/audited', function(req, res) { _demandModel.audited(req, res) });
	/* 获取未审核需求数 */
	app.get('/api/demand/getnotauditedcount', function(req, res) { _demandModel.getNotAuditedCount(req, res) });
	/* 获取未审核需求 */
	app.get('/api/demand/getnotauditeddemands', function(req, res) { _demandModel.getNotAuditedDemands(req, res) });
	/* 需求提交榜前十 */
	app.get('/api/demand/gettopsubmitter', function(req, res) { _demandModel.getTopSubmitter(req, res) });
//-----user-----
	/* 注册用户 */
	app.get('/api/user/add', function(req, res) { _userModel.add(req, res); });
	/* 删除用户 */
	app.post('/api/user/del', requireAuth, function(req, res) { _userModel.del(req, res) });
	/* 获取用户信息 */
	app.get('/api/user/getbyerp', requireAuth, function(req, res) { _userModel.getByErp(req, res) });
	/* 用户清单 */
	app.get('/api/user/list', function(req, res) { _userModel.list(req, res) });
	/* 登录 */
	app.post('/api/user/login', function(req, res) { _userModel.login(req, res); });
	/* 找回密码 */
	app.get('/api/user/findback/:erp/:random?', function(req, res) { _userModel.findBack(req, res) });
	/* 更新用户信息 */
	app.post('/api/user/update', requireAuth, function(req, res) { _userModel.update(req, res) });
	/* 更新个人资料 */
	app.post('/api/user/updateuser', requireAuth, function(req, res) { _userModel.updateUser(req, res) });
	/* 更新头像 */
	app.post('/api/user/updateavatar', requireAuth, function(req, res) { _userModel.updateAvatar(req, res) });
//-----schedule-----
	/* 通过受理人查找排期 */
	app.get('/api/schedule/getbyassignee', function(req, res) { _scheduleModel.getByAssignee(req, res) });
	/* 查找当前周所有排期 */
	app.get('/api/schedule/getalllist', function(req, res) { _scheduleModel.getAllList(req, res) });
	/* 排期修改 */
	app.post('/api/schedule/update', requireAuth, function(req, res) { _scheduleModel.update(req, res) });
//-----files-----
	/* 根据需求编号查找文件清单 */
	app.get('/api/files/getbydemandid/:demandid', function(req, res) { _filesModel.getByDemandId(req, res) });
//-----dep-----
	/* 添加部门 */
	app.post('/api/dep/add', requireAuth, function(req, res) { _depModel.add(req, res) });
	/* 删除部门 */
	app.post('/api/dep/del', requireAuth, function(req, res) { _depModel.del(req, res) });
	/* 部门列表 */
	app.get('/api/dep/list', function(req, res) { _depModel.list(req, res) });
	/* 更新部门 */
	app.post('/api/dep/update', requireAuth, function(req, res) { _depModel.update(req, res) });
//-----dtype-----
	/* 添加需求类型 */
	app.post('/api/dtype/add', requireAuth, function(req, res) { _dtypeModel.add(req, res) });
	/* 删除需求类型 */
	app.post('/api/dtype/del', requireAuth, function(req, res) { _dtypeModel.del(req, res) });
	/* 需求清单 */
	app.get('/api/dtype/list', function(req, res) { _dtypeModel.list(req, res) });
	/* 更新需求类型 */
	app.post('/api/dtype/update', requireAuth, function(req, res) { _dtypeModel.update(req, res) });
//-----business-----
	/* 添加业务类型 */
	app.post('/api/business/add', requireAuth, function(req, res) { _businessModel.add(req, res) });
	/* 删除业务类型 */
	app.post('/api/business/del', requireAuth, function(req, res) { _businessModel.del(req, res) });
	/* 业务类型清单 */
	app.get('/api/business/list', function(req, res) { _businessModel.list(req, res) });
	app.get('/api/business/listForUser', function(req, res) { _businessModel.listForUser(req, res) });
	/* 更新业务类型 */
	app.post('/api/business/update', requireAuth, function(req, res) { _businessModel.update(req, res) });
//-----Oth-----
	/* 附件上传 */
	app.post('/api/upload', requireAuth, function(req, res, next) {
		fs.exists(_confServer.tempPath, function(isExists) {
			if(!isExists) {
				fs.mkdirSync(_confServer.tempPath);
			}
			next();
		});
	}, uploader.single('file'), function(req, res, next) {
		res.send(req.file);
	});
	/* 附件下载 */
	app.get('/attachment/:filename/:originalname', function(req, res, next) {
		if(req.params.filename) {
			res.download(_confServer.uploadPath+'/'+req.params.filename, req.params.originalname);
		}
	});
	/* 删除文件 */
	app.post('/api/file/del', requireAuth, function(req, res) {
		var filePath = _confServer.tempPath+'/'+req.body.filename;
		fs.exists(filePath, function(exists) {
			if(exists) {
				fs.unlink(filePath, function(err) {
					if(err) throw err;
					res.json({state:'success', msg: '删除文件'});
				});
			} else {
				res.json({state:'fail', msg: '文件不存在'});
			}
		});
	});
	/* 退出登录 */
	app.get('/api/user/logout', function(req, res) {
		req.session.erp = null;
		req.session.name = null;
		req.session.isAdmin = null;
		res.sendStatus(200);
	});
	app.get('/api/auth', function(req, res) {
		res.send({erp:req.session.erp, name:req.session.name, isAdmin:!!req.session.isAdmin})
	});


// ----------------------------------------------- //
var server = app.listen(_confServer.port, function() {
	console.log('UFT Server Listening on port %d', server.address().port);
});