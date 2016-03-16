var galleryState = {
        url:'/gallery',
        templateUrl: 'view/gallery.html',
        controller: function($rootScope, $scope, $http, SessionService) {
            $scope.$on('authdone', function() {    
                $http.get( 'api/demand/gettopsubmitter').success(function(data) {
                    $scope.topSubmitterList = data;
                });
    
                $scope.currentPage = 1;
                $scope.itemsPerPage = 30;
                $http.get( 'api/demand/list').success(function (data) {
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
                        // 游客或非管理员用户 不可见未审核需求
                        if( (SessionService.isAnonymus || !SessionService.session.isAdmin) && e.state==0 ) {
                            return;
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
            });
        }
    }