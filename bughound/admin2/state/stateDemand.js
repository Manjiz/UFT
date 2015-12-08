var stateDemand = {
    url:'/demand',
    templateUrl: 'admin2/view/demand.html',
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

        $http.get('api/demand/list').success(function(deps) {
            $scope.dataFormat = {};
            for(var i=0;i<deps.length;i++) {
                $scope.dataFormat[deps[i].demandID] = deps[i];
            }
            $scope.dataList = deps;
            $scope.pages = Math.ceil($scope.dataList.length/$scope.itemsPerPage);
            $scope.pagination = new Array($scope.pages);
        });
        $scope.delItems = function() {
            jQuery('.ui.basic.modal.confirmdel').modal('show');
        }
        $scope.cancelDelItems = function() {
            jQuery('.ui.basic.modal.confirmdel').modal('hide');
        }
        $scope.confirmDelItems = function() {
            for (var propName in $scope.checked) {  
                if ($scope.checked.hasOwnProperty(propName) && $scope.checked[propName]) {
                    $http.post('api/demand/del', {
                        demandID: propName
                    }).success(function(data) {
                        jQuery('.ui.basic.modal.confirmdel').modal('hide');
                        $scope.dataFormat[data.demandID].dontShow = true;
                    });
                }
            }
        }
    }
}