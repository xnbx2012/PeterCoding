const _Page = require("../../__antmove/component/componentClass.js")("Page");
const _my = require("../../__antmove/api/index.js")(my);
my.setStorageSync({
    key: "activeComponent",
    data: {
        is: "/pages/index/index"
    }
});


function initTotalLineChart(canvas, width, height, dpr) {
    
}

function initRadarChart(canvas, width, height, dpr) {
    
}

_Page({
    data: {
        hidden_login: true,
        count: 0,
        ec_total_line: {
            onInit: initTotalLineChart
        },
        data: [],
        ecScatter: {
            onInit: initRadarChart
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;
        var gaokao = new Date("2023-06-07");
        var now = new Date().getTime();
        var countDown = gaokao - now;
        var day = Math.floor(countDown / (1000 * 60 * 60 * 24));
        this.setData({
            count: day
        }); // 查看是否授权

        _my.getSetting({
            success: function(res) {
                if (res.authSetting["scope.userInfo"]) {
                    _my.getUserInfo({
                        success: function(res) {
                            // 用户已经授权过,调用微信的 wx.login 接口，从而获取code,再直接跳转到主页
                            _my.login({
                                success: res => {
                                    // 获取到用户的 code 之后：res.code
                                    that.setData({
                                        hidden_login: true
                                    });
                                }
                            });
                        }
                    });
                } else {
                    that.setData({
                        hidden: false
                    }); // 用户没有授权，显示授权页面,这里不进行操作
                }
            }
        });

        var userId = "";

        _my.cloud.callFunction({
            // 需调用的云函数名
            name: "login",
            // 成功回调
            complete: function(res) {
                userId = res.result.openid;
            }
        });

        const db = _my.cloud.database();

        const _ = db.command;
        const list = [];
        db.collection("score")
            .where({
                _openid: _.eq(userId)
            })
            .get({
                success: function(res) {
                    const length = res.data.length;
                    var score = res.data[length - 1].total;
                    that.setData({
                        score: score
                    });
                }
            });
        return null;
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {},

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {},

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {},

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {},

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {},

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {},
    bindGetUserInfo: function(e) {
        if (e.detail.userInfo) {
            //用户按了允许授权按钮
            var that = this; // 获取到用户的信息了，打印到控制台上看下
            //授权成功后,跳转页面

            this.setData({
                hidden_login: true
            });
        } else {
            //用户按了拒绝按钮
            _my.showModal({
                title: "拒绝授权",
                content:
                    "您拒绝了微信授权，我们无法为您提供相应服务，请重新点击登录",
                showCancel: false,
                confirmText: "返回",
                success: function(res) {
                    // 用户没有授权成功，不需要改变 isHide 的值
                    if (res.confirm) {
                    }
                }
            });
        }
    },
    add: function(res) {
        _my.navigateTo({
            url: "../form/form"
        });
    },
    list: function(res) {
        _my.navigateTo({
            url: "../list/list"
        });
    },
    cloud: function(res) {
        _my.navigateTo({
            url: "../cloud/cloud"
        });
    }
});
