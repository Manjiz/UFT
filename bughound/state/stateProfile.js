var profileState = function($rootScope, $scope, $http, $timeout, $stateParams, datalump) {
    $scope.isShowCrop = false;
    $scope.cropContext = {};

    $http.get('api/user/getbyerp', {
        params: {
            erp: Cookie.getCookie('uerp')
        }
    }).success(function(data) {
        if(data) {
            $scope.uerp = Cookie.getCookie('uerp');
            $scope.uname = data.name;
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

    // $('.remember a').on('click', function() {
    //     var erp = $('#signin_erp').get(0).value.replace(/\s+/g, '');
    //     if(erp) {
    //         $.ajax({
    //             type: 'GET',
    //             url: 'api/user/findback/' + erp,
    //             success: function(data) {
    //                 if(data.state=='success') {
    //                     location.href="state.html#findback_continue";
    //                 } else {
    //                     Popup(data.msg)
    //                 }
    //             }
    //         })
    //     } else {
    //         Popup('请先输入要找回密码的ERP帐号')
    //     }
    // })
}
