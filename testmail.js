var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
            service: 'qq',
            auth: {
                user: '25199230@qq.com',
                pass: 'evvivfyegcglbgec'
            }
        });

transporter.sendMail({
     from: 'JDC多终端研发部<25199230@qq.com>',
     to: '25199230@qq.com',
     subject: '【需求周知测试】',
     html: '呵呵哒',
 }, function(error, info){
     if(error){
         return console.log(error);
     }
     console.log('Message sent: ' + info.response);
     console.log('>>> \x1b[36mdemand/xxx\x1b[0m::邮件周知已发送');
});