/**
 * Created by Lijingjing on 15/12/10.
 */
'use strict';

angular.module('myApp.management', ['ngRoute', 'ngImgCrop', 'chart.js', 'ngDialog'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/management', {
            templateUrl: 'view_management/management.html',
            controller: 'ManagementCtrl'
        });
    }])
    .directive('changePic', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attr, ctrl) {
                element.bind('click', function () {
                    var imageList = angular.element(document.querySelector('#d-img'));
                    imageList.attr("src", attr.src);
                    scope.$apply(function () {
                        var description = angular.element(document.querySelector('#description'));
                        description.text(attr.description);
                    });
                });
            }
        };
    })
    .factory('ManageService', ['$http', function ($http) {
        var restaurantBaseUrl = "http://202.120.40.175:21104";

        var uploadHomePagePicRequest = function (imageInfo) {
            return $http({
                method: 'POST',
                url: restaurantBaseUrl + '/restaurant/uploadFrontImage',
                data: imageInfo,
                headers: {'Content-Type': 'application/json;charset=UTF-8'},
                crossDomain: true
            });
        };

        var uploadDetailPicRequest = function (imageInfo) {
            return $http({
                method: 'POST',
                url: restaurantBaseUrl + '/restaurant/uploadNormalImage',
                data: imageInfo,
                headers: {'Content-Type': 'application/json;charset=UTF-8'},
                crossDomain: true
            });
        };

        var getRestaurantRequest = function (restaurantId) {
            return $http({
                method: 'GET',
                url: restaurantBaseUrl + '/restaurant/info?id=' + restaurantId
            });
        };

        var getHomePageRequest = function (restaurantId) {
            return $http({
                method: "GET",
                url: restaurantBaseUrl + '/restaurant/frontimage?id=' + restaurantId
            });
        };

        var getDetailRequest = function (restaurantId) {
            return $http({
                method: "GET",
                url: restaurantBaseUrl + '/restaurant/normalimage?id=' + restaurantId
            });
        };

        var getLinkmanInfosRequest = function (restaurantId) {
            return $http({
                method: "GET",
                url: restaurantBaseUrl + '/restaurant/linkman?id=' + restaurantId
            });
        };

        var getChartInfoRequest = function (id, date) {
            return $http({
                method: "GET",
                url: restaurantBaseUrl + '/order/orderCountInfo?restaurantId=' + id + '&date=' + date,
            });
        };

        var updateLinkmanInfoRequest = function (linkmanInfo) {
            return $http({
                method: "POST",
                url: restaurantBaseUrl + '/restaurant/linkman/update',
                data: linkmanInfo,
                dataType: {'Content-Type': 'application/json;charset=UTF-8'},
                crossDomain: true
            });
        };

        var updateBasicInfoRequest = function (basicInfo) {
            return $http({
                method: "POST",
                url: restaurantBaseUrl + '/restaurant/info/basicinfoedit',
                data: basicInfo,
                crossDomain: true
            });
        };

        var updatePersistInfoRequest = function (persistInfo) {
            return $http({
                method: "POST",
                url: restaurantBaseUrl + '/restaurant/info/persistinfoedit',
                data: persistInfo,
                crossDomain: true
            });
        };

        var updatePwdRequest = function (pwdInfo) {
            return $http({
                method: "POST",
                url: restaurantBaseUrl + '/restaurant/changepwd',
                data: pwdInfo,
                crossDomain: true
            });
        };

        return {
            updatePwd: function (pwdInfo) {
                return updatePwdRequest(pwdInfo);
            },
            getChartInfo: function (id, date) {
                return getChartInfoRequest(id, date);
            },
            uploadHomePagePic: function (imageInfo) {
                return uploadHomePagePicRequest(imageInfo);
            },
            uploadDetailPic: function (imageInfo) {
                return uploadDetailPicRequest(imageInfo);
            },
            getRestaurantInfo: function (restaurantId) {
                return getRestaurantRequest(restaurantId);
            },
            getHomePage: function (restaurantId) {
                return getHomePageRequest(restaurantId);
            },
            getDetail: function (restaurantId) {
                return getDetailRequest(restaurantId);
            },
            getLinkmanInfo: function (restaurantId) {
                return getLinkmanInfosRequest(restaurantId);
            },
            updateLinkmanInfo: function (linkmanInfo) {
                return updateLinkmanInfoRequest(linkmanInfo);
            },
            updateBasicInfo: function (basicInfo) {
                return updateBasicInfoRequest(basicInfo);
            },
            updatePersisInfo: function (persistInfo) {
                return updatePersistInfoRequest(persistInfo);
            }
        }

    }])
    .controller('ManagementCtrl', function ($scope, $location, $anchorScroll, ManageService, ngDialog) {
        if ($.cookie("restaurantId") == null || $.cookie("restaurantId") == "" || $.cookie("restaurantId") == undefined) {
            window.location = "/";
        }
        ManageService.getRestaurantInfo($.cookie("restaurantId"))
            .success(function (data) {
                //console.log(data);
                data.averagePrice = parseFloat(data.averagePrice, 10);
                $scope.restaurantInfo = data;
                $scope.basicInfo = data;
                $scope.persistInfo = {"persistTable": data.persistTable, "persistTime": data.persistTime};
                delete $scope.basicInfo.introduction;
                delete $scope.basicInfo.smoke;
                delete $scope.basicInfo.images;
                delete $scope.basicInfo.latitude;
                delete $scope.basicInfo.longitude;

            });

        $scope.goto = function (id) {
            $location.hash(id);
            $anchorScroll();
        };


        $scope.reservationNum = 20;
        $scope.advanceTime = 4;

        //首页图文信息预览
        $scope.previewHomePage = function () {
            ManageService.getHomePage($.cookie("restaurantId"))
                .success(function (data) {

                    $scope.restaurantInfo.homePagePic = data.picname;
                    $scope.restaurantInfo.restaurantTeles = $scope.restaurantInfo.restaurantTele.split(" ");
                    $scope.description = data.introduction;

                    if (data.picname == "" || data.picname == null)
                        $scope.restaurantInfo.homePagePic = "http://202.120.40.175:21100/restaurants/images?relativePath=NonePicture1.jpg";


                    $scope.discount = $scope.restaurantInfo.discountType == 'discount' ? true : false;
                    ngDialog.open({
                        templateUrl: 'homePic.html',
                        scope: $scope
                    });
                });
        };


    })
    .controller('ImageRecommendCtrl', function ($scope, ManageService) {

        $scope.myRecommendImage = '';
        $scope.myRecommendCroppedPic = '';
        $scope.homePageShow = false;

        var handleFileSelect = function (evt) {
            var target = (evt.currentTarget) ? evt.currentTarget : evt.srcElement;

            var file = target.files[0];
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function ($scope) {
                    $scope.myRecommendImage = evt.target.result;
                });
            };
            reader.readAsDataURL(file);
            $scope.homePageShow = true;
        };
        angular.element(document.querySelector('#fileInputRecommend')).on('change', handleFileSelect);

        $scope.uploadPic = function () {
            $scope.begin = $scope.myRecommendCroppedPic.indexOf("base64") + 7;
            $scope.myUploadPic = $scope.myRecommendCroppedPic.substr($scope.begin);


            if ($scope.picDescription.length > 20) {
                alert('图片描述不能超过20个字!');
                return;
            }

            $scope.uploadPicInfo = {
                "imageValue": $scope.myUploadPic,
                "restaurantId": parseInt($.cookie("restaurantId")),
                "pictureIntro": $scope.picDescription
            };
            $scope.uploadInfo = JSON.stringify($scope.uploadPicInfo);
            ManageService.uploadHomePagePic($scope.uploadInfo)
                .success(function (data, status) {
                    if (data.success == true) {
                        alert("图片上传成功,可以点击首页图文信息预览进行查看!");
                        $scope.homePageShow = false;
                    }
                });
        };

        $scope.removePic = function () {
            $scope.homePageShow = false;
            $scope.myRecommendImage = '';
            $scope.picDescription = '';
            $scope.myRecommendCroppedPic = '';

        };

    })
    .controller('ImageDetailCtrl', function ($scope, ManageService, ngDialog) {

        $scope.myDetailImage = '';
        $scope.myDetailCroppedImage = '';
        $scope.detailPicShow = false;

        //详情图文信息预览
        ManageService.getDetail($.cookie("restaurantId"))
            .success(function (data) {
                $scope.details = data;
            });

        //详情图文信息预览
        $scope.previewDetail = function () {
            $scope.picLen = $scope.details.length;
            if ($scope.picLen > 0) {
                $scope.discount = $scope.basicInfo.discountType == 'discount' ? true : false;
                $scope.description = $scope.details[0].introduction;
            }
            else {
                $scope.details = [];
                $scope.details[0].picname = 'http://202.120.40.175:21100/restaurants/images?relativePath=NonePicture2.jpg';
            }
            if ($scope.picLen > 5)
                $scope.details = $scope.details.slice(-5);
            ngDialog.open({
                templateUrl: 'detailPic.html',
                scope: $scope
            });
        };

        var handleFileSelect = function (evt) {

            var target = (evt.currentTarget) ? evt.currentTarget : evt.srcElement;

            var file = target.files[0];
            var reader = new FileReader();
            reader.onload = function (evt) {
                $scope.$apply(function ($scope) {
                    $scope.myDetailImage = evt.target.result;
                });
            };
            reader.readAsDataURL(file);
            $scope.detailPicShow = true;

        };
        angular.element(document.querySelector('#fileInputDetail')).on('change', handleFileSelect);

        $scope.uploadPic = function () {
            $scope.begin = $scope.myDetailCroppedPic.indexOf("base64") + 7;
            $scope.myUploadPic = $scope.myDetailCroppedPic.substr($scope.begin);

            if ($scope.picDescription.length > 20) {
                alert('图片描述不能超过20个字!');
                return;
            }

            $scope.uploadPicInfo = {
                "imageValue": $scope.myUploadPic,
                "restaurantId": parseInt($.cookie("restaurantId")),
                "pictureIntro": $scope.picDescription
            };

            $scope.uploadInfo = JSON.stringify($scope.uploadPicInfo);
            //alert($scope.uploadInfo);
            ManageService.uploadDetailPic($scope.uploadInfo)
                .success(function (data, status) {
                    if (data.success == true) {
                        alert("图片上传成功,可以点击餐厅详细图文信息预览进行查看!");
                        $scope.detailPicShow = false;
                    }
                });
        };

        $scope.removePic = function () {
            $scope.myDetailImage = '';
            $scope.myDetailCroppedImage = '';
            $scope.picDescription = '';
            $scope.detailPicShow = false;
        };

    })
    .controller('ContactCtrl', function ($scope, ManageService) {

        function checkMobile(phone) {
            var sMobile = phone;
            if (!(/^1\d{10}$/.test(sMobile))) {
                alert(sMobile + "不是完整的11位手机号或者正确的手机号");
                return false;
            }
            return true;
        }

        function checkEMail(email) {
            var temp = email;
            //对电子邮件的验证
            var myreg = /^[0-9a-z][_.0-9a-z-]{0,31}@([0-9a-z][0-9a-z-]{0,30}[0-9a-z]\.){1,4}[a-z]{2,4}$/;
            if (!myreg.test(temp)) {
                alert('提示\n请输入有效的邮箱址！\n' + temp + '不是正确的邮箱地址');
                return false;
            }
            return true;
        }

        ManageService.getLinkmanInfo($.cookie("restaurantId"))
            .success(function (data) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].priority == 1) {
                        $scope.selectContact = i;
                    }
                }
                $scope.contact = data;
            });


        $scope.updateContactInfo = function () {
            $scope.newContact = $scope.contact;
            for (var i = 0; i < $scope.contact.length; i++) {
                $scope.contact[i].restaurantId = parseInt($.cookie("restaurantId"));
                if (i == $scope.selectContact)
                    $scope.contact[$scope.selectContact].priority = 1;
                else
                    $scope.contact[i].priority = 2;
                delete $scope.contact[i].linkmanId;

                if ($scope.contact[i].linkmanPhone == "" || $scope.contact[i].linkmanName == "" || $scope.contact[i].linkmanEmail == "") {
                    $scope.newContact.splice(i, 1);
                }

                //邮箱验证
                if (!checkEMail($scope.contact[i].linkmanEmail))
                    return;
                //手机号码验证
                if (!checkMobile($scope.contact[i].linkmanPhone))
                    return;
            }

            if ($scope.newContact.length < 2) {
                alert("至少填写两位联系人详细信息!");
                return;
            }


            ManageService.updateLinkmanInfo($scope.contact)
                .success(function (data) {
                    alert("保存联系人信息成功!");
                });
        };

    })
    .controller('BasicInfoCtrl', function ($scope, ManageService) {

        $scope.saveBasicInfo = function () {
            ManageService.updateBasicInfo($scope.basicInfo)
                .success(function (data) {
                    alert("信息保存成功!");
                });
        };
    })
    .controller('PersistInfoCtrl', function ($scope, ManageService) {

        $scope.savePersistInfo = function () {

            $scope.newPersistInfo = {
                "persistTable": $scope.persistInfo.persistTable,
                "persistTime": $scope.persistInfo.persistTime,
                "restaurantId": $.cookie("restaurantId")
            };
            ManageService.updatePersisInfo($scope.newPersistInfo)
                .success(function (data) {
                    alert("自动接单设置保存成功!");
                });
        };

    })
    .controller('PwdCtrl', function ($scope, ManageService) {


        $scope.updatePwd = function () {
            if ($scope.newPwd !== $scope.newPwdRepeat) {
                console.log($scope.newPwd);
                console.log($scope.newPwdRepeat);
                alert("两次新密码输入不一致!");
                return;
            }

            $scope.pwdInfo = {
                'restaurantId': parseInt($.cookie('restaurantId')),
                'newpwd': $scope.newPwd,
                'oldpwd': $scope.oldPwd
            };

            ManageService.updatePwd($scope.pwdInfo)
                .success(function (data) {
                    if (data.success == true) {
                        alert("密码修改成功!");
                        $scope.oldPwd = "";
                        $scope.newPwd = "";
                        $scope.newPwdRepeat = "";
                    }


                })
                .error(function (error) {
                    alert(error.message);
                })
            ;
        };

    })
    .controller('ChartCtrl', function ($scope, $timeout, ManageService) {

        $scope.options = {
            tooltipEvents: [],
            showTooltips: true,
            tooltipCaretSize: 0,
            tooltipTemplate: function (label) {
                return "￥" + getTotalSales(label.label);
            },
            onAnimationComplete: function () {
                this.showTooltip(this.datasets[0].points, true);
            }
        };

        $scope.ChartDate = {
            getDay: function (month) {
                if (month == 0 || month == 2 || month == 4 || month == 6 || month == 7 || month == 9 || month == 11) {
                    return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
                }
                else if (month == 1) {
                    var date = new Date();
                    var year = date.getFullYear();
                    if ((year % 100 !== 0 && year % 4 == 0) || (year % 100 == 0 && year % 400 == 0))
                        return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29"];
                    else {
                        return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28"];
                    }
                }
                else {
                    return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];
                }

            },
            getMonth: function (month) {
                switch (month) {
                    case 0 :
                        return "一月";
                    case 1:
                        return "二月";
                    case 2:
                        return "三月";
                    case 3:
                        return "四月";
                    case 4:
                        return "五月";
                    case 5:
                        return "六月";
                    case 6:
                        return "七月";
                    case 7:
                        return "八月";
                    case 8:
                        return "九月";
                    case 9:
                        return "十月";
                    case 10:
                        return "十一月";
                    case 11:
                        return "十二月";
                }
            }

        };

        $scope.date = new Date();
        $scope.year = $scope.date.getFullYear();
        $scope.initialMonth = $scope.date.getMonth();


        $scope.month = $scope.ChartDate.getMonth($scope.initialMonth);
        $scope.labels = $scope.ChartDate.getDay($scope.initialMonth);

        function formatDate() {
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            if (month < 10)
                month = '0' + month;
            if (day < 10)
                day = '0' + day;
            var formatDate = year + '-' + month + '-' + day;
            return formatDate;
        }

        $scope.queryDate = formatDate();

        function getDateDay(inputDate) {
            var day = inputDate.split('-')[2];
            if (day[0] == '0')
                day = parseInt(day[1]);
            else day = parseInt(day);
            return day;
        }

        $scope.data = [];
        $scope.totalSale = [];
        $scope.firstData = [];

        ManageService.getChartInfo($.cookie('restaurantId'), $scope.queryDate)
            .success(function (data) {

                var now = new Date();
                var today = now.getDate();
                //var today = '16';

                //循环得到具体是几号
                for (var j = 0; j < data.length; j++) {
                    data[j].indexDay = getDateDay(data[j].dorderDate);
                }

                //循环将两个数组(销售量和销售金额)初始化
                for (var i = 0; i < today; i++) {
                    $scope.firstData[i] = 0;
                    $scope.totalSale[i] = 0;
                }

                //循环将指定是几号的信息进行填充
                for (var h = 0; h < data.length; h++) {
                    $scope.firstData[data[h].indexDay - 1] = data[h].dorderNum;
                    $scope.totalSale[data[h].indexDay - 1] = data[h].income;
                }

                $scope.data[0] = $scope.firstData;

            });


        $scope.series = ['预定量'];


        function getTotalSales(value) {
            return $scope.totalSale[value - 1];
        }

        //// Simulate async data update
        //$timeout(function () {
        //    $scope.data = [
        //        [28, 48, 40, 19, 86, 27, 90]
        //    ];
        //}, 3000);

    });