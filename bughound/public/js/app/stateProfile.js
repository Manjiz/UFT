var profileState = {
        url:'/profile',
        templateUrl: 'view/profile.html',
        controller: function($rootScope, $scope, $http, $timeout, $stateParams) {
            // $stateParams && (document.querySelector('#designated_erp_value').value = $stateParams.erp);

            $rootScope.isAdmin = (Cookie.getCookie('isAdmin')==1);
            $rootScope.notAuditedNum = 0;
            if($rootScope.isAdmin) {
                $http.get('http://' + location.host + '/api/demand/getnotauditedcount').success(function(data) {
                    $rootScope.notAuditedNum = data['COUNT(*)'];
                })
            }


            $rootScope.navidx = 'profile';
            $scope.isShowCrop = false;
            $scope.cropContext = {};

            $scope.avatarChange = function(files) {
                $scope.isShowCrop = true;

                var fd = new FormData();
                fd.append('file', files[0]);
                $http.post('http://' + location.host + '/api/upload', fd, {
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
            $scope.updateAvatar = function() {console.log(234)
                $http.post('http://' + location.host + '/api/user/updateavatar', {
                    avatar: $scope.uploadedAvatar,
                    cropContext: $scope.cropContext
                }).success(function(data) {

                })
            }
            $scope.updatePwd = function(isValid) {
                if(isValid) {
                    if($scope.newpwd==$scope.confirmnewpwd) {
                        $http.post('http://' + location.host + '/api/user/updatepwd', {
                            oldpwd: $scope.oldpwd,
                            newpwd: $scope.newpwd
                        }).success(function(data) {
                            if(data.state=='success') {
                                $scope.flashType = 'success';
                                $scope.flashText = '修改密码成功';
                            } else {
                                $scope.flashType = 'warn';
                                $scope.flashText = '密码错误';
                            }
                        })
                    } else {

                    }
                }
            }

            // $('.remember a').on('click', function() {
            //     var erp = $('#signin_erp').get(0).value.replace(/\s+/g, '');
            //     if(erp) {
            //         $.ajax({
            //             type: 'GET',
            //             url: 'http://' + location.host + '/api/user/findback/' + erp,
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
    }
