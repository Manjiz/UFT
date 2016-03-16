var stateDep = {
    url:'/dep',
    templateUrl: 'admin2/view/dep.html',
    controller: function($rootScope, $scope, $http) {
        $scope.checked = {};
        $scope.currentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.pages = 1;
        $scope.changePage = function(idx) {
            if($scope.currentPage!=idx) {
                $scope.currentPage = idx;
            }
        }

        $http.get('api/dep/list').success(function(deps) {
            $scope.dataFormat = {};
            for(var i=0;i<deps.length;i++) {
                $scope.dataFormat[deps[i].id] = deps[i];
            }
            $scope.dataList = deps;
            $scope.pages = Math.ceil($scope.dataList.length/$scope.itemsPerPage);
            $scope.pagination = new Array($scope.pages);
        });
        $scope.updateItems = function() {
            for (var propName in $scope.checked) {  
                if ($scope.checked.hasOwnProperty(propName) && $scope.checked[propName]) {
                    $http.post('api/dep/update', {
                        id:propName,
                        name:$scope.dataFormat[propName].name,
                        depType:$scope.dataFormat[propName].depType
                    }).success(function(data) {
                        if(data.state=='success') {
                            $scope.checked[data.id] = false;
                        }
                    });
                }
            }
        }
        $scope.delItems = function() {
            jQuery('.ui.modal.confirmdel').modal('show');
        }
        $scope.cancelDelItems = function() {
            jQuery('.ui.modal.confirmdel').modal('hide');
        }
        $scope.confirmDelItems = function() {
            for (var propName in $scope.checked) {  
                if ($scope.checked.hasOwnProperty(propName) && $scope.checked[propName]) {
                    $http.post('api/dep/del', {
                        id:propName
                    }).success(function(data) {
                        jQuery('.ui.modal.confirmdel').modal('hide');
                        $scope.dataFormat[data.id].dontShow = true;
                    });
                }
            }
        }
        $scope.popAddItem = function() {
            jQuery('.ui.modal.additem').modal('show');
        }
        $scope.confirmAdd = function() {
            jQuery('.ui.modal.additem').modal('hide');
            $http.post('api/dep/add', {
                name: $scope.addName,
                depType: $scope.addDeptype
            }).success(function(data) {
                if(data.state=='success') {
                    jQuery('.ui.dimmer.addsucc').dimmer({on:'click'}).dimmer('show');
                } else {
                    jQuery('.ui.dimmer.addfail').dimmer({on:'click'}).dimmer('show');
                }
            });
        }
    }
}