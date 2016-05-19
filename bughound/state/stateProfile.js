var profileState = function($rootScope, $scope, $http, $timeout, $stateParams, datalump, Session) {
    $scope.isShowCrop = false;
    $scope.cropContext = {};
    $scope.uerp = Session.userErp;
    $scope.uname = Session.userName;

    $http.get('api/user/getbyerp', {
        params: {
            erp: Session.userErp
        }
    }).success(function(data) {
        console.log(Session)
        if(data) {
            $scope.uemail = data.email;
            $scope.udep = data.depID;
            $scope.myavatar = data.avatar;
            $scope.selectedDep = $scope.udep
        }
    });

    $scope.avatarChange = function(files) {
        $scope.isShowCrop = true;

        var fd = new FormData();
        fd.append('file', files[0]);
        $http.post('api/upload', fd, {
            withCredentials: true,
            headers: {'Content-Type': undefined },
            transformRequest: angular.identity
        }).success(function(data) {
            $scope.uploadedAvatar = data.filename;
        });
    }
    $scope.closeCrop = function() {
        $scope.isShowCrop = false;
        jQuery('input[name=avatar]').val('');
    }
    $scope.updateAvatar = function() {
        $http.post('api/user/updateavatar', {
            avatar: $scope.uploadedAvatar,
            cropContext: $scope.cropContext
        }).success(function(data) {
            if(data.state=='success') {
                $scope.isShowCrop = false;
                $scope.myavatar = data.avatar;
            }
        })
    }
    $scope.updateUser = function(isValid) {
        if(isValid) {
            if($scope.newpwd==$scope.confirmnewpwd) {
                $http.post('api/user/updateuser', {
                    uerp: $scope.uerp,
                    uname: $scope.uname,
                    uemail: $scope.uemail,
                    udep: $scope.selectedDep
                }).success(function(data) {
                    if(data.state=='success') {
                        $rootScope.newlyprofile = $scope.uname+'('+$scope.uerp+')';
                        $scope.flashType = 'success';
                        $scope.flashText = '修改用户信息成功';
                    }
                })
            } else {

            }
        }
    }

    /*--------------------------------
       Kendo.DropdownList 配置
     ---------------------------------*/
     // 选择要显示部门 配置项
    $scope.depSelectOpts = {
        dataSource: datalump.depList || {
            transport: {
                read: {
                    dataType: "json",
                    url: 'api/dep/list',
                }
            }
        },
        dataTextField: "name",
        dataValueField: "id",
        index: 0,
        // headerTemplate: '<div class="dropdown-header k-widget k-header">选择部门</div>',
        template: '<span class="k-state-default">'
                    + '# if (data.parentID) { #'
                        + '{{dataItem.parentID}} - '
                    + '# } #'
                    + '{{dataItem.name}}</span>',
        dataBound: function(obj) {
            datalump.depList = obj.sender.dataSource.data();
        }
    };
}
