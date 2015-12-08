var _conf = require('./conf.js')(),
	_confServer = require('./conf-server.js')(),
	fs = require('fs'),
	bodyParser = require('body-parser'),
	schedule = require('node-schedule'),
	session = require('express-session'),
	multer = require('multer'),
	morgan = require('morgan'),

	uploader = multer({ 
		// dest:'temp/'
		storage: multer.diskStorage({
			destination: function(req, file, cb) {
				cb(null, 'temp/')
			},
			filename: function(req, file, cb) {
				var now = new Date();
				cb(null, now.getFullYear() + 
						('0' + (now.getMonth()+1)).slice(-2) + 
						('0' + now.getDate()).slice(-2) + 
						('0' + now.getHours()).slice(-2) + 
						('0' + now.getMinutes()).slice(-2) + 
						('0' + now.getSeconds()).slice(-2) + 
						('00' + now.getMilliseconds()).slice(-3)
					)
			}
		})
	}),

	express = require('express'),
	mysql = require('./mysql.js'),

	nodemailer = require('nodemailer'),
	md5 = require('./md5').md5,
	EMAIL_SECRET_KEY = 'jdcmobile',

	_demandModel = require('./models/DemandModel.js').DemandModel,
	_userModel = require('./models/UserModel.js').UserModel,
	_scheduleModel = require('./models/ScheduleModel.js').ScheduleModel,
	_filesModel = require('./models/FilesModel.js').FilesModel;

// 定时任务1/1 - 每24小时 - 清除临时文件夹中最近访问时间在3天前的文件
//						  - 清空找回密码的临时数组
schedule.scheduleJob('* */24 * * *', function() {
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
							if(new Date( new Date().getTime()-86400000*3 ) > stats.atime) {
								fs.exists(tmpPath, function(exists) {
									if(exists) {
										fs.unlink(tmpPath, function(err) {
											if(err) throw err;
										})
									}
								});
										
							}
						})
					}
				})
			})
		};
	console.log('File System::' + ' Automatically delete files...');
	walk('temp', fileList, folderList);

	console.log('User Findback List::' + ' Automatically clear array...');
	_userModel.findbackList = [];
})

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(_confServer.nodemailer);

// var transporter = nodemailer.createTransport();

var app = express();

app.use(session({
	secret: 'uft2015bymanjiz',
	cookie: {maxAge: 1000*60*60*24*15},	// 15 days
	resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('dev', {
	skip: function(req, res) {
		return res.statusCode < 400; //only log error responses
	}
}));

app.use('/admin/*.html', function(req, res, next) {
	var url = req.originalUrl;
	if ( url!='/admin/pages/login.html' && !req.session.uid) {
  	  	res.redirect('/admin/pages/login.html');
  	} else {
  	  	next();
  	}
})

/*-----------------------
   身份验证与基本路由 
  -----------------------*/
function requiredAuthentication(req, res, next) {
	var url = req.originalUrl;
	if ( url!='login.html' && !req.session.logined ) {
  	  	res.redirect('login.html');
  	} else {
  		next();
  	}
}

// 不得不说，取消了单服务器验证的方式
// app.get('/', requiredAuthentication);
// app.get('/index.html', requiredAuthentication);

app.get('/login.html', function(req, res, next) {
	if(req.session.logined) {
		res.redirect('/#/gallery');
	} else {
		next();
	}
})

app.use(express.static(__dirname + '/bughound'));
app.use('/_conf', express.static(__dirname+'/conf.js'));	//配置文件
app.use('/upload', express.static(__dirname+'/upload'));
app.use('/temp', express.static(__dirname+'/temp'));
app.use('/attachment/upload', express.static(__dirname+'/upload'));

app.get('/api/queryauth', function(req, res) { res.send(req.session) });		// erp & password
//------------------LOGIN------------------------
app.get('/api/user/login', function(req, res) { mysql.user.login(req, res); });		// erp & password
app.get('/api/user/logout', function(req, res) {
	req.session.logined = null;
	req.session.loginederp = null;
	req.session.isAdmin = null;
	res.clearCookie('isAdmin');	// 清楚管理员身份记录
	res.redirect('/#/login');
});
app.get('/api/admin/login', function(req, res) { req.session.uid = 'user'; mysql.admin.login(req, res); });	// user & password
//------------------ADD--------------------------
app.get('/api/business/add', function(req, res) { mysql.business.add(req, res) });
app.get('/api/dtype/add', function(req, res) { mysql.dtype.add(req, res) });
app.get('/api/dep/add', function(req, res) { mysql.dep.add(req, res) });
app.get('/api/user/add/:emailpid?', function(req, res) {
	if(!req.params.emailpid) {
		var email = req.query.email,
			pid = md5(email+EMAIL_SECRET_KEY);
		var mailOptions = {
		    from: 'JDC多终端研发部<jdc_fd@163.com>', // sender address
		    // from: '<metg2011@163.com>', // sender address
		    to: email, // list of receivers
		    subject: 'Hello, 感谢注册JDC需求提报系统帐号', // Subject line
		    text: 'Hello world ✔', // plaintext body
		    html: '<p>请尽快<a href="http://'+req.headers.host+'/api/user/add/'+pid+'">点击这里</a>验证您的身份，请勿直接回复该邮件</p>' // html body
		};
		transporter.sendMail(mailOptions, function(error, info){
		    if(error){
		        return console.log(error);
		    }
		    console.log('Message sent: ' + info.response);
		});
		mysql.user.reg(req, res, false, pid);
	} else {
		mysql.user.reg(req, res, true, req.params.emailpid);
	}
});	// erp & email & password & name & depID
app.get('/api/admin/add', function(req, res) { mysql.admin.add(req, res); });	// user & password
//------------------LIST-------------------------
app.get('/api/business/list', function(req, res) { mysql.business.list(req, res) });
app.get('/api/business/listForUser', function(req, res) { mysql.business.listForUser(req, res) });
app.get('/api/dtype/list', function(req, res) { mysql.dtype.list(req, res) });
app.get('/api/dep/list', function(req, res) { mysql.dep.list(req, res) });
app.get('/api/user/list', function(req, res) { mysql.user.list(req, res) });
app.get('/api/demand/list', function(req, res) { mysql.demand.list(req, res) });
//------------------DEL--------------------------
app.get('/api/business/del', function(req, res) { mysql.business.del(req, res) });
app.get('/api/dtype/del', function(req, res) { mysql.dtype.del(req, res) });
app.get('/api/dep/del', function(req, res) { mysql.dep.del(req, res) });
app.get('/api/user/del', function(req, res) { mysql.user.del(req, res) }); 
app.get('/api/admin/del', function(req, res) { mysql.admin.del(req, res); });	// user
//------------------UPDATE-----------------------
app.get('/api/business/update', function(req, res) { mysql.business.update(req, res) });
app.get('/api/dtype/update', function(req, res) { mysql.dtype.update(req, res) });
app.get('/api/dep/update', function(req, res) { mysql.dep.update(req, res) });
app.get('/api/user/update', function(req, res) { mysql.user.update(req, res) });
app.get('/api/demand/update', function(req, res) { mysql.demand.update(req, res) });
//------------------GET--------------------------
app.get('/api/demand/get', function(req, res) { mysql.demand.get(req, res) });	//demandID
//------------------OTH--------------------------
app.post('/api/upload', uploader.single('file'), function(req, res, next) {
	res.send(req.file);
});
app.get('/attachment/:filename/:originalname', function(req, res, next) {
	if(req.params.filename) {
		res.download('upload/'+req.params.filename, req.params.originalname);
	}
})

//-----file-----
	// 删除文件
	app.post('/api/file/del', function(req, res) {
		var filePath = 'temp/'+req.body.filename;
		fs.exists(filePath, function(exists) {
			if(exists) {
				fs.unlink(filePath, function(err) {
					if(err) throw err;
					res.json({state:'success', msg: '删除文件'});
				});
			} else {
				res.json({state:'fail', msg: '文件不存在'});
			}
		})
			
	})
//-----demand-----
	// 添加需求
	app.get('/api/demand/add', function(req, res) { _demandModel.add(req, res) });
	// 我的需求
	app.get('/api/demand/getmydemands/:state', function(req, res) { _demandModel.getMyDemands(req, res) });
	// 更改状态
	app.get('/api/demand/changestate', function(req, res) { _demandModel.changeState(req, res) });
	// 获取未审核需求的数量
	app.get('/api/demand/getnotauditedcount', function(req, res) { _demandModel.getNotAuditedCount(req, res) });
	// 获取未审核需求
	app.get('/api/demand/getnotauditeddemands', function(req, res) { _demandModel.getNotAuditedDemands(req, res) });
	// 需求提交榜前十
	app.get('/api/demand/gettopsubmitter', function(req, res) { _demandModel.getTopSubmitter(req, res) });
//-----user-----
	// 找回密码
	app.get('/api/user/findback/:erp/:random?', function(req, res) { _userModel.findBack(req, res) });
	app.post('/api/user/updatepwd', function(req, res) { _userModel.updatePwd(req, res) });
//-----schedule-----
	// 通过受理人查找排期
	app.get('/api/schedule/getbyassignee', function(req, res) { _scheduleModel.getByAssignee(req, res) });
	// 查找当前周所有排期
	app.get('/api/schedule/getalllist', function(req, res) { _scheduleModel.getAllList(req, res) });
//-----files-----
	// 根据需求编号查找文件清单
	app.get('/api/files/getbydemandid/:demandid', function(req, res) { _filesModel.getByDemandId(req, res) });
//-----Oth-----

var server = app.listen(_confServer.port, function() {
	console.log('UFT Server Listening on port %d', server.address().port);
});