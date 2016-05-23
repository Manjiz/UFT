var detailState = function($rootScope, $scope, $http, $sce, $stateParams, $timeout, datalump, Session) {
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
    $scope.isUseCalendar = false;
    $scope.minDate = $scope.maxDate = new Date();
    // $scope.busyDays = [];
    $scope.startChange = function() {
        $scope.minDate = new Date($scope.auditStartDate);
    }
    $scope.endChange = function() {
        $scope.maxDate = new Date($scope.auditEndDate);
    }
    $http.get('api/files/getbydemandid/'+$stateParams.did).success(function (data) {
        $scope.files = JSON.parse(data.data);
    });

    // $scope.identity = {};
    // $scope.demand = {};
    // $scope.canSolving = false;
    // $scope.canSolved = false;
    // $scope.canClosed = false;
    // $scope.canReopen = false;
    $http.get('api/demand/get?demandID='+$stateParams.did).success(function (data) {
        var demand = JSON.parse(data.data)[0],
            state;
                
        // 身份信息
        $scope.identity = {
            isAnonymus: Session.isGuest(),
            isAdmin: Session.isAdmin(),
            isSubmitter: demand.submitter==Session.userErp,
            isExecutor: demand.executor==Session.userErp,
            isAssignee: demand.assignee==Session.userErp
        };
        // 需求信息
        $scope.demand = {
            demandid: demand.demandID,
            submitDate: fmtDateNormal(demand.submitDate),
            submitter: demand.submitter,
            submitterName: demand.submitterName,
            executor: demand.executor || '',
            executorName: demand.executorName || '不限',
            name: demand.name,
            dtype: null,
            dtypeName: demand.dtypeName,
            business: null,
            businessName: demand.businessName,
            description: demand.description ? unescape(demand.description) : '',
            state: demand.state,
            executeDate: demand.executeDate,
            stateName: _conf.demandState[demand.state].name,
            startDate: demand.startDate ? new Date(demand.startDate) : '',
            endDate: demand.startDate&&demand.days ? new Date(new Date(demand.startDate).getTime()+(demand.days-1)*86400000) : '',
            days: demand.days,
            dictator: demand.dictator,
            dictatorName: demand.dictatorName,
            assignee: demand.assignee,
            assigneeName: demand.assigneeName,
            priority: demand.days ? (demand.days>5 ? '低' : (demand.days>3 ? '中' : (demand.days>1 ? '高' : '紧急'))) : '',
            solveMsg: (function() {
                var msgarr = eval('['+(demand.solveMsg || '')+']');
                msgarr.forEach(function(e, i, arr) {
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
                return msgarr;
            })()
        }
        $scope.canSolving = $scope.demand.state!=4 && ($scope.identity.isAssignee || !$scope.demand.executor || $scope.identity.isExecutor);
        $scope.canSolved = $scope.canSolving;
        $scope.canClosed = $scope.demand.state!=4 && ($scope.identity.isAdmin || $scope.identity.isSubmitter);
        $scope.canReopen = $scope.demand.state==4 && ($scope.identity.isAdmin || $scope.identity.isSubmitter);
    });

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
    $scope.smbtn = function() {
        if(document.querySelector('[name=state]:checked')) {

            var files = [];
            for(var i=0;i<$scope.uploadfiles.length;i++) {
                var e = $scope.uploadfiles[i];
                files.push({originalname: e.originalname, filename:e.filename, mimetype:e.mimetype});
            }

            $http.get('api/demand/changestate', {
                params:{
                    demandID: $scope.demand.demandid,  //需求id
                    type: document.querySelector('[name=state]:checked').value, //操作类型
                    solveMsg: $scope.applyDesc || '',   //处理信息
                    designated: null, //指派人ERP
                    files: JSON.stringify(files)    //上传文件列表
                } }).success(function (data) {
                    _POP_.toast('提交成功');
                    location.reload();
            });
        }
    }
    $scope.btnAudited = function() {
        var assignee;
        if($scope.isUseCalendar) {
            if($scope.auditStartDate && $scope.auditEndDate && $scope.auditStartDate<=$scope.auditEndDate) {
                assignee = $scope.userObjSelected.match(/\((.*)\)/)[1];
                $http.post('api/demand/audited', {
                        demandID: $scope.demand.demandid, 
                        assignee: assignee,
                        startDate: new Date($scope.auditStartDate),
                        endDate: new Date($scope.auditEndDate)
                    }).success(function (data) {
                        _POP_.toast('审核成功');
                        setTimeout(function(){
                            location.reload();
                        }, 1000)
                });
            } else {
                _POP_.toast('日期有误');
            }
        } else {
            var range = $scope.scedule ? $scope.scedule.toString().split(',') : undefined;
            if(range && range[0] < range[1]) {
                assignee = $scope.userObjSelected.match(/\((.*)\)/)[1];
                var today = new Date();
                var days = Math.floor(new Date().getTime()/86400000); //总天数唉
                var wToday = today.getDay();    //星期几
                var wStart = days - wToday;   //天数-星期日
                var wEnd = days + (6-wToday); //天数-星期六
                
                $http.post('api/demand/audited', {
                        demandID: $scope.demand.demandid, 
                        assignee: assignee,
                        startDate: new Date((wStart + parseInt(range[0]))*86400000),
                        endDate: new Date((wStart + (range[1]-1))*86400000)
                    }).success(function (data) {
                        _POP_.toast('审核成功');
                        setTimeout(function(){
                            location.reload();
                        }, 1000)
                });
            } else {
                _POP_.toast('请选择排期时间');
            }
        }
    }

    // 自动补全用户获取
    $scope.userList = [];
    $http.get('api/user/list').success(function (data) {
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
            dom.classList.remove('liveMode');
            dom.classList.remove('previewMode');
            dom.classList.add('editMode');
        }, false);
        document.getElementById('wmd-livemode-button-desc').addEventListener('click', function() {
            dom.classList.remove('editMode');
            dom.classList.remove('previewMode');
            dom.classList.add('liveMode');
        }, false);
        document.getElementById('wmd-previewmode-button-desc').addEventListener('click', function() {
            dom.classList.remove('editMode');
            dom.classList.remove('liveMode');
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
            saveUrl: 'api/upload',
            removeUrl: 'api/file/del',
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
    var isSelectUser = false;
    $scope.userObjSelectedOpts = {
        placeholder: '指派用户',
        // headerTemplate: '',
        template: '<div style="line-height:21px;text-align:center;">#: data.erp #</div>' + 
                    '<div style="margin-bottom:4px;line-height:21px;text-align:center;">#: data.depName #</div>',
        dataTextField: "nameConcatErp",
        filter: "contains",
        height: 520,
        dataSource: datalump.userList || {
            transport: {
                read: {
                    dataType: 'json',
                    url: 'api/user/list'
                }
            }
        },
        select: function(e) {
            $scope.slider.enable(true);
            isSelectUser = true;
        },
        change: function() {
            // console.log($scope.userObjSelected)
            if(!isSelectUser) {
                $scope.slider.enable(false)
            }
            isSelectUser = false;
        },
        dataBound: function(obj) {
            datalump.userList = obj.sender.dataSource.data();
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
        selectionEnd: 0
    };
}

