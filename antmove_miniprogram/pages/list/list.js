const _Page = require("../../__antmove/component/componentClass.js")("Page");
const _my = require("../../__antmove/api/index.js")(my);
my.setStorageSync({
    key: "activeComponent",
    data: {
        is: "/pages/list/list"
    }
}); // miniprogram/pages/list/list.js

_Page({
    /**
     * 页面的初始数据
     */
    data: {
        items: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        const that = this;
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
                _openid: _.eq(userId)
            })
            .get({
                success: function(res) {
                    console.log(res.data);
                    that.setData({
                        items: res.data
                    });
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
    tap: function(res) {
        var examName = res.currentTarget.id;

        _my.redirectTo({
            url: "../form/form?id=" + examName
        });
    }
});
