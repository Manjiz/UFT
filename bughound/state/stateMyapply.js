var myapplyState = {
        url:'/myapply',
        templateUrl: 'view/myapply.html',
        controller: function($rootScope, $scope, $http) {
            //-----父级-----

            function handleData($scope, data) {
                $scope.currentPage = 1;
                $scope.itemsPerPage = 3;
                tmpArr = data.data ? JSON.parse(data.data) : [];
                tmpArr.forEach(function(e, i, arr) {
                    e.submitDate = new Date(e.submitDate).toLocaleString();
                })
                // $scope.totalItems = tmpArr.length;
                $scope.rows = tmpArr;
                // if($scope.totalItems<=$scope.itemsPerPage) {
                //     document.querySelector('.turnpage').style.display = 'none';
                // } else {
                //     document.querySelector('.turnpage').style.display = 'block';
                // }
            }

            $http.get('api/demand/getmydemands/1').success(function (data) {
                handleData($scope, data);
            });
            
            $scope.idx = 1;
            $scope.mainbar = function(idx) {
                if($scope.idx!=idx)  {
                    $scope.idx = idx;
                    $http.get('api/demand/getmydemands/'+idx).success(function (data) {
                        handleData($scope, data);
                    });
                }
            }

            $scope.jumpTo = function(id) {
                location.href =  'detail.html#' + id;
            }
        }
    }