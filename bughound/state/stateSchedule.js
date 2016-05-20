var scheduleState = function($rootScope, $scope, $http, $state, datalump, Session) {
    var dataList,   //排期数据
        thisWeekStart;  //周起始日期

    // 优先显示用户所在部门
    $http.get('api/user/getbyerp', {
        params: {
            erp: Session.userErp
        }
    }).success(function(data) {
        if(data.depDemander != 1)  {
            $scope.m_showThisDep = data.depID;
        }
    });

    // 选择要显示部门 配置项
    $scope.depSelectOpts = {
        // dataSource: datalump.depList || {
        dataSource: {
            transport: {
                read: {
                    dataType: "json",
                    url: 'api/dep/list/true',
                }
            }
        },
        dataTextField: "name",
        dataValueField: "id",
        // index: 0,
        // headerTemplate: '<div class="dropdown-header k-widget k-header">选择部门</div>',
        template: '<span class="k-state-default">'
                    + '# if (data.parentID) { #'
                        + '{{dataItem.parentID}} - '
                    + '# } #'
                    + '{{dataItem.name}}</span>',
        dataBound: function(obj) {
            obj.sender.trigger('change');
            // datalump.depList && ($scope.m_showThisDep = datalump.depList[0].id);
            // datalump.depList = obj.sender.dataSource.data();
        }
    };

    // GET所有排期
    $http.get('api/schedule/getalllist').success(function(data) {
        dataList = JSON.parse(data.data);
        thisWeekStart = new Date((Math.floor(new Date().getTime()/86400000) - new Date().getDay())*86400000);
        weekScheduleV2(dataList, thisWeekStart);
    });

    /**
     * 更新排期表数据
     * dschedule {
         depID, depName, erp, name, 
         data,          //该用户的所有排期数据（源数据）
         blocks {       //在这个周内的排期
           demandID, demandName, dictator,
           weekdays,    //代表星期几的数字组成的数组
           pilefloor    //堆叠层次，排期日期交叉时可以分层堆叠
         }, 
         schedule       //一行完整的排期数据，包括 空白天 和 blocks
       }
     */
    $scope.today = Math.floor(new Date().getTime()/86400000)*86400000;  // 今天
    // Sunday base week. V1 - 按结束日期排期
    // Sunday base week. V2 - 按执行天数排期
    var weekScheduleV2 = function(data, weekStart) {
        $scope.wStart = weekStart.getTime();

        var nextWeekStart = dayBaseDate(new Date(weekStart.getTime()+7*86400000));
        weekStart = dayBaseDate(weekStart);
        for(var i=0;i<data.length;i++) {    //每个人
            var itemSchedule = data[i].data;
            var weekpile = [0,0,0,0,0,0,0];
            var wee = [[], [], [], [], [], [], []];
            data[i].blocks = [];
            for(var j=0;j<itemSchedule.length;j++) {    //每个人的每条数据
                var startDate = dayBaseDate(itemSchedule[j].startDate);
                var weekdays = [];
                // console.log(startDate, itemSchedule[j].days, weekStart)
                // 开始时间在下一周开始之前
                if( startDate<nextWeekStart ) {
                    // 排期时间跟本周时间有吻合
                    if(dayBaseDate( (startDate+itemSchedule[j].days)*86400000 ) >= weekStart ) {
                        var pilefloor = 0,
                            isFirstInThisWeek = true;
                        for(var k=1;k<7;k++) {
                            // 星期几就在排期时间内
                            if( weekStart+k >= startDate && weekStart+k < startDate+itemSchedule[j].days) {
                                if(weekpile[k] > pilefloor) {
                                    pilefloor = weekpile[k];
                                }
                                if(isFirstInThisWeek) {
                                    wee[k].push(data[i].blocks.length);
                                    isFirstInThisWeek = false;
                                    weekpile[k] = weekpile[k] + 1;
                                } else {
                                    weekpile[k] = weekpile[k-1];
                                }
                                weekdays.push(k);
                            }
                        }
                    }
                }
                if(weekdays.length>0) {
                    data[i].blocks.push({
                        id:itemSchedule[j].id, 
                        demandID:itemSchedule[j].demandID, 
                        demandName:itemSchedule[j].demandName, 
                        submitter: itemSchedule[j].submitter, 
                        dictator:itemSchedule[j].dictator, 
                        assignee:itemSchedule[j].assignee, 
                        startDate:itemSchedule[j].startDate, 
                        days:itemSchedule[j].days, 
                        weekdays:weekdays, 
                        pilefloor:pilefloor
                    });
                }
                // console.log(itemSchedule[j].id, weekpile)
                data[i].wee = wee;

            }
        }
        $scope.dschedule = data;
    }


    $scope.weekStep = 0;    //排期表显示的是哪个星期
    $scope.changeWeek = function(step) {
        $scope.weekStep = $scope.weekStep + step;
        thisWeekStart = new Date(thisWeekStart.getTime() + 86400000*7*step);
        weekScheduleV2(dataList, thisWeekStart);
    }

    $scope.repeatTable = new Array(7);   //  仅作循环表格用
    $scope.taskHeight = 40; //任务条高度

    // 获取以天为最小单位的日期
    var dayBaseDate = function(date) {
        date = date ? new Date(date) : new Date();
        if(date!='Invalid Date') {
            return Math.floor(date.getTime()/86400000);
        }
    }


    // var canWheel = true;
    // jQuery('.schedule_tbwrap_tb').on('mousewheel', function(event) {
    //     event.preventDefault();
    //     if(!canWheel) {
    //         return;
    //     }
    //     canWheel = false;
    //     var delta = event.originalEvent.deltaY;
    //     $scope.$apply(function() {
    //         $scope.changeWeek(delta>0 ? 1 : -1);
    //         setTimeout(function() {
    //             canWheel = true;
    //         },500);
    //     })
        
    // });

    $scope.changeSchedule = function(sid, did, dname, pm, dictator, assignee, startDate, days) {
        if(Session.isAdmin()) {
            $scope.isShowCdays = true;
            $scope.waitUpdateScheduleId = sid;
            $scope.waitUpdateScheduleDid = did;
            $scope.waitUpdateScheduleName = dname;
            $scope.waitUpdateSchedulePM = pm;
            $scope.waitUpdateScheduleDictator = dictator;
            $scope.waitUpdateScheduleAssignee = assignee;
            $scope.waitUpdateScheduleStartdate = new Date(startDate);
            $scope.waitUpdateScheduledays = days;
        } else {
            $state.go('detail', {did:did});
        }
    }

    $scope.updateSchedule = function() {
        if(Session.isAdmin) {
            $http.post('api/schedule/update', {
                id: $scope.waitUpdateScheduleId,
                date: parseInt(new Date($scope.waitUpdateScheduleStartdate).getTime()),
                days: $scope.waitUpdateScheduledays
            }).success(function(data) {
                if(data.state=='success') {
                    // GET所有排期
                    $http.get('api/schedule/getalllist').success(function(data) {
                        dataList = JSON.parse(data.data);
                        weekScheduleV2(dataList, thisWeekStart);
                    });
                    Popup('更新成功');
                }
                $scope.isShowCdays = false;
            });
        }
    }
    // -------------------
    //  拖放事件处理
    // -------------------
    var dragid, dragday, dragassignee, dragel, dragelshow;
    $scope.onDragStart = function(e) {
        if(Session.isAdmin) {
            dragel = e.currentTarget[0];
            var preTrHeight = jQuery(dragel).parents('tr').height();
            jQuery(dragel).parents('tr').css('height', preTrHeight+'px');
            dragel.style.display = 'none';
            dragelshow = false;
            dragid = e.currentTarget[0].getAttribute('data-id');
            dragday = e.currentTarget[0].getAttribute('data-day');
            dragassignee = e.currentTarget[0].getAttribute('data-assignee');
        }
    }
    $scope.draggableHint = function(e) {
        if(Session.isAdmin) {
            var dom = jQuery(e[0]);
            var width = dom.width();
            return dom.clone().css({'width':width, 'opacity':0.7});
        }
    }
    $scope.onDragEnd = function(e) {
        if(Session.isAdmin) {
            if(!dragelshow) {
                dragel.style.display = 'block';
                jQuery(dragel).parents('tr').removeAttr('style');
            }
        }
    }
    $scope.onDragEnter = function(e) {
        if(Session.isAdmin) {
            e.dropTarget[0].classList.add('active');
        }
    }
    $scope.onDragLeave = function(e) {
        if(Session.isAdmin) {
            e.dropTarget[0].classList.remove('active');
        }
    }
    $scope.onDrop = function(e) {
        if(Session.isAdmin) {
            dragelshow = true;
            var target = e.dropTarget[0],
                id = dragid,
                day = target.getAttribute('data-day'),  // 毫秒数
                assignee = target.getAttribute('data-assignee');
            if(day==dragday && assignee==dragassignee) {
                e.dropTarget[0].classList.remove('active');
                dragel.style.display = 'block';
                jQuery(dragel).parents('tr').removeAttr('style');
                return;
            }
            $http.post('api/schedule/update', {
                id: id,
                date: parseInt(day),
                assignee: assignee
            }).success(function(data) {
                if(data.state=='success') {
                    // GET所有排期
                    $http.get('api/schedule/getalllist').success(function(data) {
                        dataList = JSON.parse(data.data);
                        weekScheduleV2(dataList, thisWeekStart);
                    });
                }
            })
        }
    }
    /*--------------------------------
       Kendo.DatePicker 配置
     ---------------------------------*/
    $scope.datePickerOpts = {
        value: new Date(),
        format: "yyyy-MM-dd",
        footer: "Today - #=kendo.toString(data, 'd') #"
    }
}
