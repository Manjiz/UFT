/*
 * Configuration of UFT 
 * Created on 2015-11-12 by Manji.z
 * Last Modified at 2015-11-12 by Manji.z
 * Only For Server
 */

;(function() {
	'use strict';

	 var root = this;
	 var conf = function(obj) {
	 	return {
	 		port: 80,
	 		nodemailer: {
			    service: '163',
			    auth: {
			        user: 'jdc_fd@163.com',
			        pass: 'uliientoslppnlzb'
			    }
			},
			tempPath: 'temp',
			uploadPath: 'upload',
			returnUrl: 'http://localhost:8088/',
	 	};
	 }

	 // -------------------------------------------------------
	 if(typeof exports !== 'undefined') {
	 	if(typeof module !== 'undefined' && module.exports) {
	 		exports = module.exports = conf;
	 	}
	 	exports.conf = conf;
	 } else if (typeof define === 'function' && define.amd) {
	 	define('underscore', function() {
	 		return conf;
	 	})
	 } else {
	 	root.conf = conf;
	 }
}).call(this);