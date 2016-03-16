var loginState = function($scope, $http, $rootScope, $state, AUTH_EVENTS, AuthService, datalump) {
    /*--------------------------------
       Kendo.Upload 配置
     ---------------------------------*/
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
        index: -1,
        dataBound: function(obj) {
            datalump.depList = obj.sender.dataSource.data();
        }
        // headerTemplate: '<div class="dropdown-header k-widget k-header">选择部门</div>'
    };

    var regErp = /[a-z]+[0-9]*/,
        regName = /^[\u4E00-\u9FA5]+$/,    //中文名
        regPwd = /.{6,8}/,
        regEmail = /^[a-zA-Z0-9]+@jd\.com/;

    $scope.signInRemember = !!Cookie.getCookie('signinremember');
    if($scope.signInRemember) {
        $scope.signInErp = Cookie.getCookie('signinerp') || '';
        $scope.signInPwd = Cookie.getCookie('signinpwd') || '';
    }
    $scope.EnterForSignIn = function($event) {
        if($event.keyCode==13) {
            $scope.signIn();
        }
    }
    $scope.signIn = function() {
        var erp = $scope.signInErp.replace(/\s+/g, '');
        // MD5 32位
        var pwd = $scope.signInRemember ? $scope.signInPwd : md5($scope.signInPwd);

        if(!regErp.test(erp)) { Popup('ERP 输入有误'); return; }
        if(!regPwd.test(pwd)) { Popup('密码长度不对'); return; }

        AuthService.login({
            erp: erp,
            password: pwd
        }).then(function(user) {
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            // 记住密码
            if($scope.signInRemember) {
                Cookie.setCookie('signinerp', erp, 15);
                Cookie.setCookie('signinpwd', pwd, 15);
                Cookie.setCookie('signinremember', true, 15);
            } else {
                Cookie.delCookie('signinerp');
                Cookie.delCookie('signinpwd');
                Cookie.delCookie('signinremember');
            }

            // location.href = '/#/apply';
            $state.go('apply');
        }).catch(function() {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
            Popup(data.msg)
        })
    }

    ;(function($) {
        $('.signup .form_btn').on('click', function(event) {
            event.preventDefault();
            var erp = $('#signup_erp').val().replace(/\s+/g, ''),
                name = $('#signup_name').val().replace(/\s+/g, ''),
                email = $('#signup_email').val().replace(/\s+/g, ''),
                // pwd = $('#signup_pwd').val().replace(/\s+/g, ''),
                dep = $('#signup_dep').val();
            
            if(!erp) { 
                Popup('ERP帐号不能为空'); return;
            } else if(!reg_erp.test(erp)) { 
                Popup('ERP 格式有误'); return; 
            }
            if(!name) { 
                Popup('姓名不能为空'); return;
            } else if(!reg_name.test(name)) { 
                Popup('姓名格式有误'); return; 
            }
            if(!email) {
                Popup('公司邮箱不能为空'); return;
            }
            // if(!pwd) {
            //     Popup('密码不能为空'); return; 
            // } else if (!reg_pwd.test(pwd)) {
            //     Popup('密码格式不对'); return; 
            // }
    
            $.ajax({
                type: 'GET',
                url: 'api/user/add',
                data: {erp: erp, email: email, password: 123456, name: name, depID: dep},
                success: function(data) {
                    if(data.state=='success') {
                        location.href="state.html#checksucc";
                    } else {
                        Popup(data.msg)
                    }
                }
            })
        })
    
        $('.remember a').on('click', function() {
            var erp = $('#signin_erp').get(0).value.replace(/\s+/g, '');
            if(erp) {
                $.ajax({
                    type: 'GET',
                    url: 'api/user/findback/' + erp,
                    success: function(data) {
                        if(data.state=='success') {
                            location.href="state.html#findback_continue";
                        } else {
                            Popup(data.msg)
                        }
                    }
                })
            } else {
                Popup('请先输入要找回密码的ERP帐号')
            }
        })
    })(jQuery)
}
