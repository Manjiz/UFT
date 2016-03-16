var applyState = {
        // url:'/apply/:erp?/:date?',
        url:'/apply?erp&date&uname',
        templateUrl: 'view/apply.html',
        controller: function($rootScope, $scope, $http, $timeout, $stateParams, SessionService, datalump) {
            //-----页面状态数据-----
            $scope.pageState = 'original';  //original=申请页 | succ=成功页 | [fail=失败页]
            $scope.getDemandId = 0;
            $scope.apply = {}

            // 初始化页面数据
            if(datalump.dtypeList) {
                $scope.dtypeRows = datalump.dtypeList;
            } else {
                $http.get('api/dtype/list').success(function (data) {
                    $scope.dtypeRows = data;
                    datalump.dtypeList = data;
                });
            }

            $scope.customOptions = {
                dataSource: datalump.businessList || {
                    transport: {
                        read: {
                            dataType: "json",
                            url: 'api/business/listForUser',
                        }
                    }
                },
                dataTextField: "name",
                dataValueField: "id",
                index: -1,
                // headerTemplate: '<div class="dropdown-header k-widget k-header">选择业务</div>',
                // using {{angular}} templates:
                template: '<span class="k-state-default">'
                            + '# if (data.parentID) { #'
                                + '{{dataItem.parentID}} - '
                            + '# } #'
                            + '{{dataItem.name}}</span>',
                dataBound: function(obj) {
                    datalump.businessList = obj.sender.dataSource.data();
                }
            };

            // 提交需求
            $scope.submit = function() {
                function scrollTo(where) {
                    var y = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
                    if(y>where) {
                        var timer = setInterval(function() {
                            y = y-50;
                            if(y>where) {
                                window.scroll(0, y);
                            } else {
                                window.scroll(0, where);
                                clearInterval(timer);
                            }
                        }, 10)
                    } else if(y<where) {
                        var timer = setInterval(function() {
                            y = y+50;
                            if(y<where) {
                                window.scroll(0, y);
                            } else {
                                window.scroll(0, where);
                                clearInterval(timer);
                            }
                        }, 10)
                    }
                }
                // 校验表单+错误提示
                if(!$scope.apply.name) { 
                    scrollTo(70);
                    jQuery('.applyform_it.dname').addClass('error'); 
                    setTimeout(function() { 
                        jQuery('.applyform_it.dname').removeClass('error'); 
                    }, 800); return; 
                }
                if(!$scope.apply.dtype) {
                    scrollTo(125);
                    jQuery('.applyform_it.dtype').addClass('error'); 
                    setTimeout(function() { 
                        jQuery('.applyform_it.dtype').removeClass('error'); 
                    }, 800); return; 
                }
                if(!$scope.apply.business) { 
                    scrollTo(250);
                    jQuery('.applyform_it.dbusiness').addClass('error'); 
                    setTimeout(function() { 
                        jQuery('.applyform_it.dbusiness').removeClass('error'); 
                    }, 800); return;
                }


                var files = [];
                for(var i=0;i<$scope.files.length;i++) {
                    var e = $scope.files[i];
                    files.push({originalname: e.originalname, filename:e.filename, mimetype:e.mimetype});
                }
                var executor = $scope.userObjSelected.value().match(/\((.*)\)/);
                $http.get('api/demand/add', {
                    params: {
                        dtype: $scope.apply.dtype,                  //需求类型
                        business: $scope.apply.business,            //业务类型
                        name: $scope.apply.name,                    //需求名称
                        executeDate: $scope.executeDate.value() || '',      //预知完成时间
                        description: $scope.apply.description,      //需求描述
                        executor: executor && executor[1] || '',//待执行人
                        files: JSON.stringify(files),                               //文件清单[{originalname:xx, filename:xx, mimetype:xx}]
                        ua: JSON.stringify({
                            width:document.documentElement.clientWidth, 
                            height:document.documentElement.clientHeight, 
                            dpr:window.devicePixelRatio, 
                            ua: new UAParser().getResult()
                        })
                    }
                }).success(function(data) {
                    $scope.pageState = 'succ';
                    $scope.getDemandId = data.data;
                })
            }
            // 上传文件
            $scope.files = [];
            // 保存草稿
            $scope.savedraft = function() {
                localStorage.name = $scope.apply.name || '';
                localStorage.executeDate = $scope.apply.executeDate || '';
                localStorage.description = $scope.apply.description || '';
            }

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
                        $scope.files = $scope.files.concat(e.response);
                        // console.log($scope.files)
                    } else if (e.operation=='remove') {
                        for(var i=0, len=$scope.files.length; i<len; i++) {
                            if($scope.files[i].uid == e.files[0].uid) {
                                $scope.files.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
            /*--------------------------------
             ---------------------------------*/
            $scope.datePickerOpts = {
                value: $stateParams.date ? new Date(parseInt($stateParams.date)) : new Date(),
                format: "yyyy-MM-dd",
                // min: new Date(),
                footer: "Today - #=kendo.toString(data, 'd') #"
            }
            /*--------------------------------
               Kendo.AutoComplete 配置
             ---------------------------------*/
            $scope.userObjSelectedOpts = {
                placeholder: '指派用户',
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
                value: $stateParams.erp&&$stateParams.uname ? $stateParams.uname+'('+$stateParams.erp+')' : '',
                dataBound: function(obj) {
                    datalump.userList = obj.sender.dataSource.data();
                }
            }
        }
    }
