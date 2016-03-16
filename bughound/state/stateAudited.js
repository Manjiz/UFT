var auditedState = function($rootScope, $scope, $http) {
    function handleData($scope, data) {
        $scope.currentPage = 1;
        $scope.itemsPerPage = 3;
        tmpArr = data.data ? JSON.parse(data.data) : [];
        tmpArr.forEach(function(e, i, arr) {
            e.submitDate = new Date(e.submitDate).toLocaleString();
        })
        $scope.totalItems = tmpArr.length;
        $scope.rows = tmpArr;
        // if($scope.totalItems<=$scope.itemsPerPage) {
        //     document.querySelector('.turnpage').style.display = 'none';
        // } else {
        //     document.querySelector('.turnpage').style.display = 'block';
        // }
    }

    $http.get('api/demand/getnotauditeddemands').success(function (data) {
        handleData($scope, data);
    });

    $scope.jumpTo = function(id) {
        location.href =  'detail.html#' + id;
    }
}
