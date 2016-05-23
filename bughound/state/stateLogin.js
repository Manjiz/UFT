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
        },
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
        if(!$scope.signInErp) {
            _POP_.toast('ERP 不能为空！');
            return;
        }
        var erp = $scope.signInErp.replace(/\s+/g, '');
        // MD5 32位
        // var pwd = $scope.signInPwd.length==32 ? $scope.signInPwd : md5($scope.signInPwd);

        if(!regErp.test(erp)) { _POP_.toast('ERP 输入有误'); return; }
        // if(!regPwd.test(pwd)) { _POP_.toast('密码长度不对'); return; }

        AuthService.login({
            erp: erp,
            // password: pwd
        }).then(function(res) {
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            // 记住密码
            if($scope.signInRemember) {
                Cookie.setCookie('signinerp', erp, 15);
                // Cookie.setCookie('signinpwd', pwd, 15);
                Cookie.setCookie('signinremember', true, 15);
            } else {
                Cookie.delCookie('signinerp');
                // Cookie.delCookie('signinpwd');
                Cookie.delCookie('signinremember');
            }
            $state.go('apply');
        }).catch(function(res) {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
            _POP_.toast('登录失败')
        })
    }

    $scope.signUpErp = '';
    $scope.signUpName = '';
    $scope.signUpEmail = '';
    $scope.signUpPwd = '';
    $scope.signUp = function() {
        var erp = $scope.signUpErp.replace(/\s+/g, ''),
            name = $scope.signUpName.replace(/\s+/g, ''),
            email = $scope.signUpEmail.replace(/\s+/g, ''),
            // pwd = $scope.signUpPwd.replace(/\s+/g, ''),
            dep = $scope.signUpDep;
        if(!erp) { 
            _POP_.toast('ERP帐号不能为空'); return;
        } else if(!regErp.test(erp)) { 
            _POP_.toast('ERP 格式有误'); return; 
        }
        if(!name) { 
            _POP_.toast('姓名不能为空'); return;
        } else if(!regName.test(name)) { 
            _POP_.toast('姓名格式有误'); return; 
        }
        if(!email) {
            _POP_.toast('公司邮箱不能为空'); return;
        } else if(!regEmail.test(email)) {
            _POP_.toast('邮箱格式不正确'); return;
        }
        // if(!pwd) {
        //     _POP_.toast('密码不能为空'); return; 
        // } else if (!regPwd.test(pwd)) {
        //     _POP_.toast('密码长度为6-8位'); return; 
        // }
        // if(!dep) {
        //     _POP_.toast('未选择所属部门'); return; 
        // }
        console.log(erp, email, pwd, name, dep)
        $http.post('api/user/add', {
            erp: erp, email: email, password: pwd, name: name, depID: dep
        }).then(function(res) {
            if(res.data.state=='success') {
                // location.href="state.html#checksucc";
                _POP_.toast('注册成功，请到邮箱验证身份');
            } else {
                _POP_.toast(res.data.msg)
            }
        });
    }
}
