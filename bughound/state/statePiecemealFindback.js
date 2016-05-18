var piecemealFindbackState = function($scope, $http) {
    $scope.go = function(valid) {
        if(valid) {
            console.log($scope.account, $scope.newpwd)
            $http.get('api/user/findback/' + $scope.account+'/'+$scope.newpwd).then(function(res) {
                console.log(res)
                if(res.data.state=='success') {
                    // location.href="state.html#findback_continue";
                } else {
                    Popup(res.data.msg)
                }
            });
        } else {
            Popup('输入错误');
        }
    }
}
