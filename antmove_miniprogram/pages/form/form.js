const _Page = require("../../__antmove/component/componentClass.js")("Page");
const _my = require("../../__antmove/api/index.js")(my);
my.setStorageSync({
    key: "activeComponent",
    data: {
        is: "/pages/form/form"
    }
}); // miniprogram/pages/form/form.js

_Page({
    /**
     * 页面的初始数据
     */
    data: {
        show_login: true,
        submit: "提交",
        again: false,
        date: "",
        list: {
            date: "点击以选择"
        },
        hidden: true
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var id = options.id;
        console.log(id);

        if (id != undefined) {
            var userId = "";

            _my.cloud.callFunction({
                // 需调用的云函数名
                name: "login",
                // 成功回调
                complete: function(res) {
                    console.log("云函数结果");
                    console.log(res);
                    userId = res.result.openid;
                }
            });

            const db = _my.cloud.database();

            const _ = db.command;
            const list = [];
            db.collection("score")
                .where({
                    _id: _.eq(id)
                })
                .get({
                    success: function(res) {
                        console.log(res.data[0]);
                        that.setData({
                            list: res.data[0],
                            submit: "更新数据",
                            again: true,
                            hidden: false
                        });
                    }
                });
        }

        var that = this;

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
                                        show_login: false
                                    });
                                    console.log(res);
                                }
                            });
                        }
                    });
                } else {
                    that.setData({
                        show_login: true
                    }); // 用户没有授权，显示授权页面,这里不进行操作
                }
            }
        });
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

            console.log("用户的信息如下：");
            console.log(e.detail.userInfo); //授权成功后,跳转页面

            this.setData({
                show_login: false
            });
        } else {
            //用户按了拒绝按钮
            _my.showModal({
                title: "拒绝授权",
                content:
                    "您拒绝了微信授权，我们无法为您提供相应服务，请重新点击登录",
                showCancel: false,
                confirmText: "确定",
                success: function(res) {
                    // 用户没有授权成功，不需要改变 isHide 的值
                    if (res.confirm) {
                        console.log("用户点击了“确定”");
                        this.setData({
                            show_login: true
                        });
                    }
                }
            });
        }
    },
    bindDateChange: function(e) {
        console.log("picker发送选择改变，携带值为", e.detail.value);
        this.setData({
            hidden_date: true
        });
        this.setData({
            date: e.detail.value
        });
    },
    formSubmit: function(e) {
        var formData = e.detail.value;
        console.log(formData);

        const db = _my.cloud.database();

        _my.cloud.callFunction({
            // 需调用的云函数名
            name: "login",
            // 成功回调
            complete: function(res) {
                console.log("云函数结果");
                console.log(res);
                formData.userId = res.result.openid;
            }
        });

        const again = this.data.again;
        const _ = db.command;
        console.log("again" + again);

        if (again) {
            db.collection("score")
                .doc(this.data.list._id)
                .set({
                    data: formData,
                    success: function(res) {
                        console.log(res);

                        _my.showModal({
                            title: "更新成功",
                            content:
                                "成绩数据已成功同步至云端数据库，点击确定返回主页。",
                            showCancel: false,
                            confirmText: "确定",
                            success: function(res) {
                                _my.navigateTo({
                                    url: "../index/index"
                                });
                            }
                        });
                    },
                    fail: console.error
                });
        } else {
            const score = db.collection("score");
            score.add({
                data: formData,
                success: function(res) {
                    console.log(res);

                    _my.showModal({
                        title: "提交成功",
                        content:
                            "成绩数据已成功提交至云端数据库，点击确定返回主页。",
                        showCancel: false,
                        confirmText: "确定",
                        success: function(res) {
                            _my.navigateBack({
                                complete: res => {}
                            });
                        }
                    });
                }
            });
        }
    },
    inputFocus: function(res) {
        console.log(res);
    },
    delete: function(res) {
        const db = _my.cloud.database();

        db.collection("score")
            .doc(this.data.list._id)
            .remove({
                success: function(res) {
                    console.log(res);

                    _my.showModal({
                        title: "删除成功",
                        content: "成绩数据已删除，点击确定返回主页。",
                        showCancel: false,
                        confirmText: "确定",
                        success: function() {
                            _my.navigateTo({
                                url: "../index/index"
                            });
                        }
                    });

                    console.log("成功删除");
                }
            });
    }
});
