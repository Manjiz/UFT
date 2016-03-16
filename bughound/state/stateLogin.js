var loginState = {
        url:'/login',
        templateUrl: 'view/login.html',
        controller: function($scope, $http, $rootScope, SessionService, datalump) {
            $scope.verp = Cookie.getCookie('verp');
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

            ;(function($) {
                var reg_erp = /[a-z]+[0-9]*/,
                    reg_name = /^[\u4E00-\u9FA5]+$/,    //中文名
                    reg_pwd = /.{6,8}/,
                    reg_email = /^[a-zA-Z0-9]+@jd\.com/;
                var erp = Cookie.getCookie('erp'),          //初始化输入区数据
                    pwd = Cookie.getCookie('pwd');          //初始化输入区数据
                    ischeck = Cookie.getCookie('ischeck');  //初始化输入区数据
                erp && ($('#signin_erp').get(0).value = erp);
                // pwd && ($('#signin_pwd').get(0).value = pwd);
                ischeck && ($('#remember').get(0).checked = true);

                $('#signin_erp, #signin_pwd').on('keyup', function(event) {
                    event = event || window.event;
                    if(event.which==13) {
                        login();
                    }
                })
                // 登录
                $('.signin .form_btn').on('click', function(event) {
                    event.preventDefault();
                    login();
                })
                function login() {
                    var erp = $('#signin_erp').get(0).value.replace(/\s+/g, '');
                    // var pwd = $('#signin_pwd').get(0).value;
            
                    // 根据其长度判断是否是从Cookie里读取的加密密码（密码长度为6-8）
                    // pwd = pwd.length==32 ? pwd : md5(pwd);
            
                    if(!reg_erp.test(erp)) { Popup('ERP 输入有误'); return; }
                    // if(!reg_pwd.test(pwd)) { Popup('输入密码有误'); return; }
            
                    $.ajax({
                        type: 'POST',
                        url: 'api/user/login',
                        data: {erp: erp, password: 123456},
                        success: function(data) {
                            if(data.state=='success') {
                                $rootScope.loginprofile = data.data.name+'('+data.data.erp+')';
                                // 记住密码
                                if($('#remember').get(0).checked) {
                                    Cookie.setCookie('erp', erp, 15);
                                    // Cookie.setCookie('pwd', pwd, 15);
                                    Cookie.setCookie('ischeck', true, 15);
                                } else {
                                    Cookie.delCookie('erp');
                                    // Cookie.delCookie('pwd');
                                    Cookie.delCookie('ischeck');
                                }
                                Cookie.setCookie('uname', data.data.name, 15);
                                Cookie.setCookie('uerp', data.data.erp, 15);
                                Cookie.setCookie('isAdmin', data.data.isAdmin, 15);
                                SessionService.isAnonymus = false;
                                location.href = "/#/gallery"
                            } else {
                                Popup(data.msg)
                            }
                        }
                    })
                }
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
    }
