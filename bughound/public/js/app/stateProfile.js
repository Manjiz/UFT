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

            $scope.updatePwd = function(isValid) {
                if(isValid) {
                    if($scope.newpwd==$scope.confirmnewpwd) {console.log(3)
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
