var stateBusiness = {
    url:'/business',
    templateUrl: 'admin2/view/business.html',
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

        $http.get('api/business/list').success(function(deps) {console.log(deps)
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
                    $http.post('api/business/update', {
                        id:propName,
                        name:$scope.dataFormat[propName].name,
                        parentID: $scope.dataFormat[propName].parentID
                    }).success(function(data) {
                        if(data.state=='success') {
                            $scope.checked[data.id] = false;
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
                    $http.post('api/business/del', {
                        id:propName
                    }).success(function(data) {
                        jQuery('.ui.basic.modal.confirmdel').modal('hide');
                        $scope.dataFormat[data.id].dontShow = true;
                    });
                }
            }
        }
        $scope.popAddItem = function() {
            jQuery('.ui.modal.additem').modal('show');
            jQuery('.ui.dropdown.addparentb').dropdown();
        }
        $scope.confirmAdd = function() {
            jQuery('.ui.modal.additem').modal('hide');
            $http.post('api/business/add', {
                name: $scope.addName,
                parentID: $scope.addParent
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