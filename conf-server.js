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
	 		port: 8088,
	 		nodemailer: {
			    service: '163',
			    auth: {
			        user: 'jdc_fd@163.com',
			        pass: 'uliientoslppnlzb'
			    }
			},
			tempPath: 'temp',
			uploadPath: 'upload',
			// returnUrl: 'http://aotu.jd.com/uft/',
			returnUrl: 'http://localhost:8088/',
			// erpauth: 'http://localhost/erp/index.php'
			erpauth: 'http://aotu.jd.com/erp/index.php'
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