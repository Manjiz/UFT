var detailState = {
        url:'/detail/:did',
        templateUrl: 'view/detail.html',
        controller: function($rootScope, $scope, $http, $sce, $stateParams, $timeout, SessionService) {
            $rootScope.isAdmin = (Cookie.getCookie('isAdmin')==1);
            $rootScope.notAuditedNum = 0;
            if($rootScope.isAdmin) {
                $http.get('http://' + location.host + '/api/demand/getnotauditedcount').success(function(data) {
                    $rootScope.notAuditedNum = data['COUNT(*)'];
                })
            }
            $scope.SessionService = SessionService;
            /*-------------------------------------------------------
                ROOT: uerp
                STATE: 
                    editor, demandid, isAdmin, isSubmitter, 
                    isExecutor, dtype, business, state, 
                    stateName, name, executeDate, priority, 
                    submiteDate, description, submitter, executor, 
                    solver, solveDate, files, solveMsg, 
                    uploadfiles, userList, editor.text
             --------------------------------------------------------*/
            $rootScope.navidx = 'detail';

            $scope.isUseCalendar = false;

            $scope.minDate = $scope.maxDate = new Date();
            $scope.busyDays = [];
            $scope.startChange = function() {
                $scope.minDate = new Date($scope.startDate);
            }
            $scope.endChange = function() {
                $scope.maxDate = new Date($scope.endDate);
            }
            var week = {
                days: [true,true,true,true,true,true,true],
                init: function() {
                    this.days = [true,true,true,true,true,true,true];
                }
            }
            // Kendo.Slider 修改原纯数字表现，周日至周六，时间段形式
            $scope.$on('$viewContentLoaded', function(event){
                var i = 0,
                    week = ['日','一','二','三','四','五','六'];
                for(;i<7;i++) {
                    jQuery('.k-slider-horizontal .k-label').eq(i).text(week[i]);
                }
                jQuery('.k-slider-horizontal .k-label').eq(0).css({"left": "0"}).text(week[i]);
                jQuery('div.k-slider').css({"width": "501px"});
                jQuery('.k-slider-horizontal .k-tick-large.k-first').css({"width": "72px"});
                jQuery('.k-slider-horizontal .k-tick-large.k-last').css({"width": "1px"});
                jQuery('.k-slider-horizontal .k-tick-large').css({"backgroundPosition": "0 -2px"});
                jQuery('.k-slider-horizontal .k-last .k-label').hide();
            });

            $scope.demandid = $stateParams.did;
            $http.get('http://' + location.host + '/api/files/getbydemandid/'+$scope.demandid).success(function (data) {
                $scope.files = JSON.parse(data.data);
            });
            $http.get('http://' + location.host + '/api/demand/get?demandID='+$scope.demandid).success(function (data) {
                var demand = JSON.parse(data.data)[0],
                    state;

                $scope.demandid = demand.demandID;
                $scope.isAdmin = data.isAdmin;
                $scope.isSubmitter = demand.submitter==$scope.uerp;
                $scope.isExecutor = demand.executor==$scope.uerp;
                $scope.dtype = demand.dtypeName;
                $scope.business = demand.businessName;
                $scope.state = demand.state;
                    $scope.stateName = _conf.demandState[demand.state].name;
                $scope.name = demand.name;
                $scope.startDate = demand.startDate ? new Date(demand.startDate) : '';
                $scope.endDate = demand.endDate ? new Date(demand.endDate) : '';
                $scope.executeDate = demand.executeDate;    
                    $scope.priority = (function() {
                        if(!$scope.executeDate)  {
                            return '无限制';
                        }
                        var next = new Date($scope.executeDate).getTime(),
                            now = new Date().getTime();
                        if(next<now) {
                            return '已过期';
                        } else if((next-now)/(24*60*60*1000)>5) {
                            return '低'
                        } else if((next-now)/(24*60*60*1000)>3) {
                            return '中'
                        } else if((next-now)/(24*60*60*1000)>2) {
                            return '高'
                        } else if((next-now)/(24*60*60*1000)<2) {   //剩1天了，还不开工！！！
                            return '紧急'
                        }
                    })();
                $scope.submitDate = fmtDateNormal(demand.submitDate);
                $scope.description = demand.description ? unescape(demand.description) : '';
                $scope.submitter = demand.submitter; $scope.submitterName = demand.submitterName;
                $scope.executor = demand.executor || ''; $scope.executorName = demand.executorName || '不限制';
                $scope.solver = $scope.uerp;
                // $scope.solveDate = fmtDateNormal(demand.solveDate);  //恐怕我并不需要完成时间（信息重复）

                $scope.solveMsg = eval('['+(demand.solveMsg || '')+']');
                $scope.solveMsg.forEach(function(e, i, arr) {
                    e.date = fmtDateNormal(e.date);
                    e.typeName = (function() {switch(e.type) {
                        case 'audited': return '审核';
                        case 'closed': return '关闭';
                        case 'reopen': return '重启';
                        case 'designated': return '指派';
                        case 'solving': return '受理';
                        case 'solved': return '完成';
                    } })()
                    e.cont = $sce.trustAsHtml(e.cont ? new Markdown.Converter().makeHtml(e.cont) : '<div style="margin-top:10px;color:#ccc;">无信息</div>');
                })

                // audited closed reopen solving solved  |  designated
                if($scope.state==0) {   //需求在未审核状态
                    if($scope.isAdmin) {   //如果是管理员
                        document.querySelector('.closed').removeAttribute('disabled');
                    } else if($scope.isSubmitter) {
                        document.querySelector('.closed').removeAttribute('disabled');
                    }
                } else if($scope.state==4) {    //需求已关闭
                    if($scope.isAdmin || $scope.isSubmitter) {   //如果是管理员或提交人
                        document.querySelector('.reopen').removeAttribute('disabled');
                    }
                } else {
                    if($scope.executor=='不限制' || $scope.isExecutor) {
                        document.querySelector('.solving').removeAttribute('disabled');
                        document.querySelector('.solved').removeAttribute('disabled');
                    }
                    if($scope.isAdmin || $scope.isSubmitter) {   //如果是管理员或提交人
                        document.querySelector('.closed').removeAttribute('disabled');
                    }
                }
            });

            $scope.smbtn = function() {
                if(document.querySelector('[name=state]:checked')) {

                    var files = [];
                    for(var i=0;i<$scope.uploadfiles.length;i++) {
                        var e = $scope.uploadfiles[i];
                        files.push({originalname: e.originalname, filename:e.filename, mimetype:e.mimetype});
                    }

                    $http.get('http://' + location.host + '/api/demand/changestate', {
                        params:{
                            demandID: $scope.demandid,  //需求id
                            type: document.querySelector('[name=state]:checked').value, //操作类型
                            solveMsg: $scope.applyDesc || '',   //处理信息
                            designated: null, //指派人ERP
                            files: JSON.stringify(files)    //上传文件列表
                        } }).success(function (data) {
                            Popup('提交成功');
                            location.reload();
                    });
                }
            }
            $scope.btnAudited = function() {
                var canAudit = true,
                    designated;
                if($scope.isUseCalendar) {
                    if($scope.startDate && $scope.endDate && $scope.startDate<=$scope.endDate) {
                        for(var i=0;i<$scope.busyDays.length;i++) {
                            if($scope.busyDays[i].getTime()>=new Date($scope.startDate).getTime() && $scope.busyDays[i].getTime()<=new Date($scope.endDate).getTime()) {
                                Popup('排期时间冲突');
                                return;
                            }
                        }
                        designated = $scope.userObjSelected.match(/\((.*)\)/)[1];
                        $http.get('http://' + location.host + '/api/demand/changestate', {
                            params:{
                                demandID: $scope.demandid, 
                                type: 'audited',
                                designated: designated,
                                startDate: new Date($scope.startDate),
                                endDate: new Date($scope.endDate)
                            } }).success(function (data) {
                                Popup('审核成功');
                                setTimeout(function(){
                                    location.reload();
                                }, 1000)
                        });
                    } else {
                        Popup('日期有误');
                    }
                } else {
                    var range = $scope.scedule ? $scope.scedule.toString().split(',') : undefined;
                    if(range && range[0] < range[1]) {
                        for(var i=range[0]; i<range[1]; i++) {
                            if(!week.days[i]) {
                                canAudit = false;
                                break;
                            }
                        }
                        if(canAudit) {
                            designated = $scope.userObjSelected.match(/\((.*)\)/)[1];
                            var today = new Date();
                            var days = Math.floor(new Date().getTime()/86400000); //总天数唉
                            var wToday = today.getDay();    //星期几
                            var wStart = days - wToday;   //天数-星期日
                            var wEnd = days + (6-wToday); //天数-星期六
                            
                            $http.get('http://' + location.host + '/api/demand/changestate', {
                                params:{
                                    demandID: $scope.demandid, 
                                    type: 'audited',
                                    designated: designated,
                                    startDate: new Date((wStart + parseInt(range[0]))*86400000),
                                    endDate: new Date((wStart + (range[1]-1))*86400000)
                                } }).success(function (data) {
                                    Popup('审核成功');
                                    setTimeout(function(){
                                        location.reload();
                                    }, 1000)
                            });
                        } else {
                            Popup('排期时间冲突');
                        }
                    } else {
                        Popup('请选择排期时间');
                    }
                }
            }

            // 自动补全用户获取
            $scope.userList = [];
            $http.get('http://' + location.host + '/api/user/list').success(function (data) {
                $scope.userList = data || [];
            });

            $scope.uploadfiles = [];

            /*--------------------------------
               MD 编辑器 配置
             ---------------------------------*/
            (function () {
                var converter = new Markdown.Converter();
                // converter.hooks.chain("preBlockGamut", function (text, rbg) {
                //     return text.replace(/^ {0,3}""" *\n((?:.*?\n)+?) {0,3}""" *$/gm, function (whole, inner) {
                //         return "<blockquote>" + rbg(inner) + "</blockquote>\n";
                //     });
                // });
                // 插件机制：
                // preConversion/postConversion 文本处理前/后触发
                // plainLinkText 处理有效链接字符串时触发
                // preBlockGamut/postNormalization 文本一般化处理前/后触发
                // preSpanGamut/postBlockGamut 在处理区块级MD代码前后触发，后者在处理完 List/Code block/Block Quote 之后，抽取HTML代码之前触发
                // preSpanGamut/postSpanGamut 处理行内级MD代码前后触发
                converter.hooks.chain("preConversion", function (text) {
                    return text.replace(/\b(a\w*)/gi, "*$1*");
                });
                // converter.hooks.chain("plainLinkText", function (url) {
                //     return "This is a link to " + url.replace(/^https?:\/\//, "");
                // });
            
                var editor = new Markdown.Editor(converter, "-desc", {
                        helpButton: {
                            title: 'Markdown 语法',
                            handler: function() {
                                alert("详查 Markdown 语法");
                            }
                        },
                        strings: {
                            bold: "加粗 <strong> Ctrl+B",
                            boldexample: "加粗文字",
                            italic: "斜体 <em> Ctrl+I",
                            italicexample: "斜体文字",
                            link: "链接 <a> Ctrl+L",
                            linkdescription: "链接描述",
                            linkdialog: '插入链接',
                            quote: "引用 <blockquote> Ctrl+Q",
                            quoteexample: "引用文字",
                            code: "代码 <pre><code> Ctrl+K",
                            codeexample: "请输入代码",
                            image: "图片 <img> Ctrl+G",
                            imagedescription: "enter image description here",
                            imagedialog: "<p>插入图片</p>",
                            olist: "有序列表 <ol> Ctrl+O",
                            ulist: "普通列表 <ul> Ctrl+U",
                            litem: "列表项目",
                            heading: "标题 <h1>/<h2> Ctrl+H",
                            headingexample: "标题文字",
                            hr: "分割线 <hr> Ctrl+R",
                            undo: "撤销 - Ctrl+Z",
                            redo: "重做 - Ctrl+Y",
                            redomac: "重做 - Ctrl+Shift+Z",
                            help: "Markdown 语法",
                            fullscreen: "全屏",
                            editmode: '编辑模式',
                            livemode: '实时模式',
                            previewmode: "预览模式"
                        }
                    }
                );
                // onPreviewRefresh | postBlockquoteCreation | insertImageDialog
                editor.run();
                // editor.getConverter();
                // editor.refreshPreview();
                var dom = document.getElementById('editor');
                document.getElementById('wmd-editmode-button-desc').addEventListener('click', function() {
                    // dom.classList.remove('editMode');
                    dom.classList.remove('liveMode');
                    dom.classList.remove('previewMode');
                    dom.classList.add('editMode');
                }, false);
                document.getElementById('wmd-livemode-button-desc').addEventListener('click', function() {
                    dom.classList.remove('editMode');
                    // dom.classList.remove('liveMode');
                    dom.classList.remove('previewMode');
                    dom.classList.add('liveMode');
                }, false);
                document.getElementById('wmd-previewmode-button-desc').addEventListener('click', function() {
                    dom.classList.remove('editMode');
                    dom.classList.remove('liveMode');
                    // dom.classList.remove('previewMode');
                    dom.classList.add('previewMode');
                }, false);
                document.getElementById('wmd-fullscreen-button-desc').addEventListener('click', function() {
                    dom.classList.toggle('fullscreenMode');
                }, false);            
            })();
            /*--------------------------------
               Kendo.Upload 配置
             ---------------------------------*/
            $scope.uploadOpts = {
                async: {
                    saveUrl: 'http://' + location.host + '/api/upload',
                    removeUrl: 'http://' + location.host + '/api/file/del',
                    removeField: 'filename'
                },
                localization: {
                    select: '上传文件',
                    cancel: '取消',
                    dropFilesHere: '把文件拖到这里上传',
                    headerStatusUploading: '上传中',
                    headerStatusUploaded: '完成',
                    remove: '移除文件',
                    retry: '重试',
                    statusUploading: '上传中',
                    statusUploaded: '上传完成',
                    statusFailed: '上传失败'
                },
                success: function(e) {
                    if(e.operation=='upload') {
                        e.files[0].name = e.response.filename;
                        e.response.uid = e.files[0].uid;
                        $scope.uploadfiles = $scope.uploadfiles.concat(e.response);
                    } else if (e.operation=='remove') {
                        for(var i=0, len=$scope.uploadfiles.length; i<len; i++) {
                            if($scope.uploadfiles[i].uid == e.files[0].uid) {
                                $scope.uploadfiles.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            };
            /*--------------------------------
               Kendo.startDatepickerOptions 配置
             ---------------------------------*/
            $scope.startDatepickerOptions = {
                format: "yyyy-MM-dd",
                footer: "Today - #=kendo.toString(data, 'd') #"
            };
            /*--------------------------------
               Kendo.endDatepickerOptions 配置
             ---------------------------------*/
            $scope.endDatepickerOptions = {
                format: "yyyy-MM-dd",
                footer: "Today - #=kendo.toString(data, 'd') #"
            };
            /*--------------------------------
               Kendo.AutoComplete 配置（depID depName email erp id name）
             ---------------------------------*/
            $scope.userObjSelectedOpts = {
                placeholder: '指派用户',
                // headerTemplate: '',
                template: '<div style="line-height:21px;text-align:center;">#: data.erp #</div>' + 
                            '<div style="margin-bottom:4px;line-height:21px;text-align:center;">#: data.depName #</div>',
                dataTextField: "nameConcatErp",
                filter: "contains",
                height: 520,
                dataSource: {
                    transport: {
                        read: {
                            dataType: 'json',
                            url: 'http://' + location.host + '/api/user/list'
                        }
                    }
                },
                select: function(e) {
                    var dataItem = this.dataItem(e.item.index());
                    $http.get('http://' + location.host + '/api/schedule/getbyassignee', {
                        params: {
                            erp: dataItem.erp
                        }
                    }).success(function(data) {
                        week.init();
                        jQuery('.k-slider-horizontal .k-tick').removeClass('contradict');
                        // 求出这周的时间段，注意东八区，转日期默认为当天8:00
                        var today = new Date();
                        var days = Math.floor(new Date().getTime()/86400000); //天数唉
                        var wToday = new Date(today).getDay();
                        var wStart = days - wToday;   //天数
                        var wEnd = days + (7-wToday); //天数
                        var data = JSON.parse(data.data);
                        $scope.busyDays = [];
                        for(var i=0;i<data.length;i++) {
                            var start = Math.floor(new Date(data[i].startDate).getTime()/86400000),
                                end = Math.floor(new Date(data[i].endDate).getTime()/86400000);
                            var s = start-wStart,
                                e = end-wStart;
                            console.log(start, end, s, e)
                            for(var j=s; j<=e; j++) {
                                if(j>=0&&j<=6) {
                                    week.days[j] = false;
                                    jQuery('.k-slider-horizontal .k-tick').eq(j).addClass('contradict');
                                }
                            }
                            for(var j=start;j<=end;j++) {
                                $scope.busyDays.push(new Date(j*86400000));
                            }
                        }
                        $scope.slider.enable(true)
                    })
                },
                change: function() {
                    jQuery('.k-slider-horizontal .k-tick').removeClass('contradict');
                    $scope.slider.enable(false)
                }
            };
            /*--------------------------------
               Kendo.Slider 配置
             ---------------------------------*/
            $scope.rangeSliderOpts = {
                enabled: false,
                tooltip: {
                    enabled: false
                },
                min: 0,
                max: 7,
                smallStep: 1,
                largeStep: 1,
                selectionStart: 0,
                selectionEnd: 0,
                change: function(e) {
                    var range = $scope.scedule ? e.value.toString().split(',') : [0,0];
                    for(var i=range[0]; i<range[1]; i++) {
                        if(!week.days[i]) {
                            jQuery('.k-slider-selection').addClass('disabled');
                            return;
                        }
                    }
                    jQuery('.k-slider-selection').removeClass('disabled');
                },
                slide: function(e) {
                    var range = $scope.scedule ? e.value.toString().split(',') : [0,0];
                    for(var i=range[0]; i<range[1]; i++) {
                        if(!week.days[i]) {
                            jQuery('.k-slider-selection').addClass('disabled');
                            return;
                        }
                    }
                    jQuery('.k-slider-selection').removeClass('disabled');
                }
            };
        }
    }

