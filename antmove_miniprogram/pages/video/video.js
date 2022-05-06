const _Page = require("../../__antmove/component/componentClass.js")("Page");
my.setStorageSync({
    key: "activeComponent",
    data: {
        is: "/pages/video/video"
    }
}); // miniprogram/pages/video.js

_Page({
    /**
     * 页面的初始数据
     */
    data: {
        videolink: "",
        COS: {},
        cos: {},
        key: ""
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;

        var COS = require("./lib/cos-wx-sdk-v5.js");

        that.setData({
            COS: COS
        });
        that.setData({
            cos: new COS({
                SecretId: "AKIDFI5qNcYKo32lY7lQAD0XnGbkpdEaikNl",
                SecretKey: "IL9j49ys0oMceRxDRQ8bpqdOzXs0s8Ax"
            })
        });
        var key = options.key;
        var url = that.data.cos.getObjectUrl({
            Bucket: "highschool-1256959209",
            Region: "ap-guangzhou",
            Key: key
        });
        console.log(url);
        that.setData({
            videolink: url
        });
        that.setData({
            key: key
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
    onShareAppMessage: function() {}
});
