var mysql = require('mysql'),
	async = require('async'),
	fs = require('fs');

var pool = exports.pool = mysql.createPool({
	connectionLimit: 100,
	queueLimit: 20,
	host: 'localhost',
	user: 'root',
	password: '',
	database : 'uft',
	charset : 'utf8_general_ci'
})