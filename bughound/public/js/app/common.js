/**
 * ==================================================
 * 通用Cookie操作函数
 * ==================================================
 */
var Cookie = {
    setCookie: function(name, value, days) {
        var date = new Date();
        date.setDate(date.getDate() + days);    //保存15天
        document.cookie = name + '=' + escape(value) + ';expires=' + date.toGMTString();
    },
    getCookie: function(name) {
        var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
        if(arr) {
            return unescape(arr[2]); 
        }
        return null;
    },
    delCookie: function(name) {
        var exp = new Date();
        exp.setTime(exp.getTime() - 1);
        var cval = this.getCookie(name);
        if(cval) {
            document.cookie= name + "="+cval+";expires="+exp.toGMTString();
        }
    }
}

/**
 * ==================================================
 * 通用弹框函数，需页面DOM对象支持
 * ==================================================
 */
var Popup = function(msg) {
    var mask = document.querySelector('.mod_mask'),
        dom = document.querySelector('.mod_mask_wrap_cont_msg');
    mask.style.display = 'block';
    dom.innerHTML = msg;
    setTimeout(function() {
        mask.style.display = 'none';
    },1500)
}

/**
 * ==================================================
 * 通用Ajax函数，jQAjax的替代品
 * ==================================================
 */
var Ajax = function(opts) {
    var xhr, params;
    opts = opts || {};
    opts.type = (opts.type || 'GET').toUpperCase();
    opts.dataType = opts.dataType || 'json';
    params = (function(data) {
        var arr = [];
        for(var name in data) {
            arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
        }
        arr.push(('v=' + Math.random()).replace('.'));
        return arr.join('&');
    })(opts.data);

    if(window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }

    xhr.onreadystatechange = function() {
        if(xhr.readyState==4) {
            var status = xhr.status;
            if(status>=200 && status<300) {
                opts.success && opts.success(xhr.responseText, xhr.responseXML);
            } else {
                opts.fail && opts.fail(status);
            }
        }
    }

    if(opts.type=='GET') {
        xhr.open('GET', opts.url + '?' + params, true);
        xhr.send(null);
    } else if(opts.type=='POST') {
        xhr.open('POST', opts.url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);
    }
}

// function isInArray(date, dates) {
//     for(var idx = 0, length = dates.length; idx < length; idx++) {
//         var d = dates[idx];
//         if (date.getFullYear() == d.getFullYear() &&
//             date.getMonth() == d.getMonth() &&
//             date.getDate() == d.getDate()) {
//             return true;
//         }
//     }
//     return false;
// }

//年月日/月日/n小时前/n分钟前/n秒前
function fmtDateNormal(date) {
    if(!date) {
        return '';
    }
    var date = new Date(date),
        now = new Date(),
        sepdays = Math.floor(now.getTime()/86400000) - Math.floor(date.getTime()/86400000);
    if(sepdays>7) {
        if(now.getFullYear()-date.getFullYear()>0) {
            return date.getFullYear()+'年'+(date.getMonth()+1)+'月'+date.getDate()+'日';
        } else {
            return (date.getMonth()+1)+'月'+date.getDate()+'日';
        }
    } else if(sepdays>0) {
        return sepdays + '天前';
    } else {
        if(now.getHours()-date.getHours()>0) {
            return (now.getHours()-date.getHours())+'小时前';
        } else if(now.getMinutes()-date.getMinutes()>0) {
            return (now.getMinutes()-date.getMinutes())+'分钟前';
        } else {
            return (now.getSeconds()-date.getSeconds())+'秒前';
        }
    }
}

/**
 * ==================================================
 * 通用日期格式化函数 YYYY-MM-DD hh:mm:ss
 * ==================================================
 */
// var fmtDate = function(dateStr, fmt, opts) {
//     var date, year, month, day, hour, minute, second, millisecond;
//     opts = {
//         isTwelve: false,
//         monthShow: 'number', //thumb, cn
//         dayShow: 'cardinal', //ordinal
//     }
//     fmt = typeof(fmt)==='string' ? fmt : '';
//     date = new Date(dateStr);
//     if(!isNaN(date.getTime())) {
//         year = date.getFullYear();
//         month = date.getMonth() + 1;
//         day = date.getDate();
//         hour = date.getHours();
//         minute = date.getMinutes();
//         second = date.getSeconds();
//         millisecond = date.getMilliseconds();
//     } else {
//         return dateStr;
//     }
// }