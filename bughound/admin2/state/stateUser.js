var stateUser = {
    url:'/user',
    templateUrl: 'admin2/view/user.html',
    controller: function($rootScope, $scope, $http) {
        var hasInitDropdownUI = 2;  // 因为开始的时候有一次触发的
        var dereg = $scope.$watch('checked', function() {
            hasInitDropdownUI--;
            if(!hasInitDropdownUI) {
                console.log('changed');
                jQuery('.ui.dropdown.modifyitem').dropdown();
                dereg();
            }
        }, true);
        
        $scope.checked = {};
        $scope.currentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.pages = 1;
        $scope.changePage = function(idx) {
            if($scope.currentPage!=idx) {
                $scope.currentPage = idx;
            }
        }
        $scope.changeShowThisDep = function(idx) {
            $scope.showThisDep = idx;
        }

        $http.get('api/dep/list').success(function(deps) {
            $scope.depList = deps;
            $scope.showThisDep = deps[0].id;
            $scope.depFormat = {};
            for(var i=0;i<deps.length;i++) {
                $scope.depFormat[deps[i].id] = deps[i];
            }
            setTimeout(function() {
                jQuery('.ui.dropdown.selectshowdep').dropdown();
            }, 200);
        });
        $http.get('api/user/list').success(function(users) {console.log(users)
            $scope.dataFormat = {};
            for(var i=0;i<users.length;i++) {
                $scope.dataFormat[users[i].erp] = users[i];
            }
            $scope.dataList = JSON.parse(JSON.stringify(users));
            $scope.pages = Math.ceil($scope.dataList.length/$scope.itemsPerPage);
            console.log($scope.dataList.length, $scope.itemsPerPage)
            $scope.pagination = new Array($scope.pages);
        });
        $scope.updateItems = function() {
            for (var propName in $scope.checked) {  
                if ($scope.checked.hasOwnProperty(propName) && $scope.checked[propName]) {
                    // console.log(propName, $scope.dataFormat[propName].name, $scope.dataFormat[propName].email, $scope.dataFormat[propName].depID, $scope.dataFormat[propName].isAdmin)
                    $http.post('api/user/update', {
                        erp:propName,
                        name:$scope.dataFormat[propName].name,
                        email:$scope.dataFormat[propName].email,
                        depID:$scope.dataFormat[propName].depID,
                        isAdmin:$scope.dataFormat[propName].isAdmin,
                        showMeInSchedule: $scope.dataFormat[propName].showMeInSchedule
                    }).success(function(data) {
                        if(data.state=='success') {
                            $scope.checked[data.erp] = false;
                        }
                    });
                }
            }
        }
        $scope.delItems = function() {
            jQuery('.ui.basic.modal.confirmdel').modal('show');
        }
        $scope.cancelDelItems = function() {
            jQuery('.ui.basic.modal.confirmdel').modal('hide');
        }
        $scope.confirmDelItems = function() {
            for (var propName in $scope.checked) {  
                if ($scope.checked.hasOwnProperty(propName) && $scope.checked[propName]) {
                    $http.post('api/user/del', {
                        erp:propName
                    }).success(function(data) {
                        if(data.state=='success') {
                            jQuery('.ui.basic.modal.confirmdel').modal('hide');
                            $scope.dataFormat[data.erp].dontShow = true;
                        }
                    });
                }
            }
        }
    }
}