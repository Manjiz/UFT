/*
 * Configuration of UFT 
 * Created on 2015-11-12 by Manji.z
 * Last Modified at 2015-11-12 by Manji.z
 * For Server and Client
 */

;(function() {
	'use strict';

	 var root = this;
	 var conf = function(obj) {
	 	return {
	 		// 对应数据表
	 		demandState: {
	 			'0': {label:'submitted', name:'未审核', alias:['已提交']},
	 			'1': {label:'audited', name:'未处理', alias:['已审核']},
	 			'2': {label:'processing', name:'处理中', alias:['进行中']},
	 			'3': {label:'solved', name:'待确认', alias:['前端需求待确认', '处理完成', '已解决']},
	 			'4': {label:'confirmed', name:'已确认', alias:['确认']}
	 		}
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

/*-----------------------------
		配置联调
  -----------------------------*/
// Server: 

/* Client:
	1. 广场页-需求状态
	2. 详情页-需求状态
----------------*/