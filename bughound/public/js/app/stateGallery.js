var galleryState = {
        url:'/gallery',
        templateUrl: 'view/gallery.html',
        controller: function($rootScope, $scope, $http) {
            $rootScope.isAdmin = (Cookie.getCookie('isAdmin')==1);
            $rootScope.notAuditedNum = 0;
            if($rootScope.isAdmin) {
                $http.get('http://' + location.host + '/api/demand/getnotauditedcount').success(function(data) {
                    $rootScope.notAuditedNum = data['COUNT(*)'];
                })
            }
            //-----父级-----
            $rootScope.navidx = 'gallery';

            // 选择要显示部门 配置项
            $scope.depSelectOpts = {
                dataSource: {
                    transport: {
                        read: {
                            dataType: "json",
                            url: 'http://' + location.host + '/api/dep/list',
                        }
                    }
                },
                dataTextField: "name",
                dataValueField: "id",
                // index: 0,
                headerTemplate: '<div class="dropdown-header k-widget k-header">选择部门</div>',
                // using {{angular}} templates:
                template: '<span class="k-state-default">'
                            + '# if (data.parentID) { #'
                                + '{{dataItem.parentID}} - '
                            + '# } #'
                            + '{{dataItem.name}}</span>'
            };
            $http.get('http://' + location.host + '/api/demand/gettopsubmitter').success(function(data) {
                $scope.topSubmitterList = data.data;
            });
            // GET所有排期
            $http.get('http://' + location.host + '/api/schedule/getalllist').success(function(data) {
                $scope.dataList = JSON.parse(data.data);
                $scope.nowDate = new Date();
                $scope.dschedule = $scope.weekSchedule($scope.dataList, $scope.nowDate);
            });
            /**
             * 更新排期表数据
             * dschedule {
                 depID, depName, erp, name, 
                 data,      //该用户的所有排期数据
                 blocks {   //在这个周内的排期
                   demandID, demandName, dictator,
                   block    //代表星期几的数字组成的数组
                 }, 
                 schedule   //一行完整的排期数据，包括 空白天 和 blocks
               }
             */
            $scope.weekSchedule = function(data, whichWeek) {
                var today = whichWeek || new Date();

                var days = Math.floor(today.getTime()/86400000); //天数唉
                var wToday = new Date(today).getDay();
                var wStart = days - wToday;   //天数
                $scope.wStart = wStart*86400000;  // 给 周日周一...周六 显示日期用
                var wEnd = days + (7-wToday); //天数
                for(var i=0;i<data.length;i++) {    //每个人
                    var itemSchedule = data[i].data;
                    data[i].blocks = [];
                    for(var j=0;j<itemSchedule.length;j++) {    //每个人的每条数据
                        var start = Math.floor(new Date(itemSchedule[j].startDate).getTime()/86400000),
                            end = Math.floor(new Date(itemSchedule[j].endDate).getTime()/86400000);
                        var s = start-wStart,
                            e = end-wStart;
                        var block = [];
                        for(var k=s; k<=e; k++) {
                            if(k>=0&&k<=6) {
                                block.push(k);
                            }
                        }
                        if(block.length>0) {
                            data[i].blocks.push({demandID:itemSchedule[j].demandID, demandName:itemSchedule[j].demandName, dictator:itemSchedule[j].dictator, block:block});
                        }
                    }
                }

                for(var i=0;i<data.length;i++) {
                    var blocks = data[i].blocks;

                    var weekMove = -1;
                    var newArr = [];
                    if(blocks.length>0) {
                        for(var j=0;j<blocks.length;j++) {
                            if(blocks[j].block[0] > weekMove+1) {
                                // 让空白td带上日期
                                for(var k=0;k<blocks[j].block[0]-weekMove-1;k++) {
                                    newArr = newArr.concat({date: new Date((wStart+weekMove+k+1)*86400000)})
                                }
                            }
                            newArr = newArr.concat(blocks[j]);
                            weekMove = blocks[j].block.slice(-1)[0];
                        }
                    }
                    // 让空白td带上日期
                    for(var k=0;k<6-weekMove;k++) {
                        newArr = newArr.concat({date: new Date((wStart+weekMove+k+1)*86400000)});
                    }
                    data[i].schedule = newArr;
                }

                return data;
            }
            $scope.weekStep = 0;    //排期表显示的是哪个星期
            $scope.changeWeek = function(weekStep) {
                $scope.weekStep = $scope.weekStep+weekStep;
                $scope.nowDate = new Date($scope.nowDate.getTime()+86400000*7*weekStep);
                $scope.dschedule = $scope.weekSchedule($scope.dataList, $scope.nowDate);
                // $scope.$apply();
            }

            $scope.toggleShowMenu = function() {
                $scope.showMenuShow = !!!$scope.showMenuShow;
            }

            $scope.currentPage = 1;
            $scope.itemsPerPage = 30;
            $http.get('http://' + location.host + '/api/demand/list').success(function (data) {
                var tmpArr = data ? data : []
                    tr = [];

                tmpArr.forEach(function(e, i, arr) {
                    var state, days, submitDateStr;
                    if(!e.executeDate) {
                        days = '--'
                    } else {
                        var left = Math.floor((new Date(e.executeDate) - new Date(e.submitDate))/(24*60*60*60*1000));
                        left<0 && (left=0);
                        days = left + '天';
                    }
                    tr.push( {
                        demandID:e.demandID, 
                        dtype:e.dtype, 
                        business:e.business, 
                        name:e.name, 
                        submitter:e.submitter, 
                        submitterName:e.submitterName, 
                        executor:e.executor, 
                        submitDate: fmtDateNormal(e.submitDate),
                        executeDays:days, 
                        state: e.state,
                        stateName:_conf.demandState[e.state].name
                    } )
                })
                $scope.totalItems = tr.length;
                $scope.rows = tr;
            });

            /**
             * 周排期表->选择空白时间排期
             */
            $scope.selectScheduleDays = function() {
                
            }
        }
    }