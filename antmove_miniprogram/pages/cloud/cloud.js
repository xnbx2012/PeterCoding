const _Page = require("../../__antmove/component/componentClass.js")("Page");
const _my = require("../../__antmove/api/index.js")(my);
my.setStorageSync({
    key: "activeComponent",
    data: {
        is: "/pages/cloud/cloud"
    }
}); // miniprogram/pages/cloud/cloud.js

_Page({
    /**
     * 页面的初始数据
     */
    data: {
        path: "",
        cos: {},
        items: [],
        files: [],
        COS: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var COS = require("./lib/cos-wx-sdk-v5.js");

        if (typeof options.path != "undefined") {
            console.log(options.path);
            this.setData({
                path: options.path
            });
        } else {
            this.setData({
                path: ""
            });
        }

        this.setData({
            COS: COS
        });
        this.setData({
            cos: new COS({
                SecretId: "AKIDFI5qNcYKo32lY7lQAD0XnGbkpdEaikNl",
                SecretKey: "IL9j49ys0oMceRxDRQ8bpqdOzXs0s8Ax"
            })
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        console.log("调用了onShow函数");
        var that = this;
        this.data.cos.getBucket(
            {
                Bucket: "highschool-1256959209",

                /* 必须 */
                Region: "ap-guangzhou",

                /* 必须 */
                Prefix: that.data.path,

                /* 非必须 */
                Delimiter: "/"
                /* 非必须 */
            },
            function(err, data) {
                var dirs = data.CommonPrefixes;
                var files = data.Contents;
                var tmp_dirs = [];
                var tmp_files = [];

                for (var i = 0; i < dirs.length; i++) {
                    var nonSliter = dirs[i].Prefix.substring(
                        0,
                        dirs[i].Prefix.lastIndexOf("/")
                    );
                    var folder = nonSliter.substring(
                        nonSliter.lastIndexOf("/") + 1,
                        nonSliter.length
                    );
                    tmp_dirs.push({
                        Prefix: folder
                    });
                }

                for (var i = 0; i < files.length; i++) {
                    if (files[i] != that.data.path) {
                        var file = files[i].Key.substring(
                            files[i].Key.lastIndexOf("/") + 1,
                            files[i].Key.length
                        );
                        tmp_files.push({
                            Key: file
                        });
                    }
                }

                console.log("tmpfiles from onShow function");
                console.log(tmp_files);
                console.log(data);
                that.setData({
                    items: tmp_dirs
                });
                that.setData({
                    files: tmp_files
                }); //that.setData({path: ""})
            }
        );
    },

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
    onShareAppMessage: function() {
        let url = encodeURIComponent(
            "/pages/cloud/cloud?path=" + this.data.path
        );
        return {
            title: "文件分享",
            path: "/pages/cloud/cloud?path=" + this.data.path
        };
    },
    selected: function(res) {
        var that = this;
        that.setData({
            path: that.data.path + res.currentTarget.dataset.item + "/"
        });
        this.data.cos.getBucket(
            {
                Bucket: "highschool-1256959209",

                /* 必须 */
                Region: "ap-guangzhou",

                /* 必须 */
                Prefix: that.data.path,

                /* 非必须 */
                Delimiter: "/"
                /* 非必须 */
            },
            function(err, data) {
                var dirs = data.CommonPrefixes;
                var files = data.Contents;
                var tmp_dirs = [];
                var tmp_files = [];

                for (var i = 0; i < dirs.length; i++) {
                    var nonSliter = dirs[i].Prefix.substring(
                        0,
                        dirs[i].Prefix.lastIndexOf("/")
                    );
                    var folder = nonSliter.substring(
                        nonSliter.lastIndexOf("/") + 1,
                        nonSliter.length
                    );
                    tmp_dirs.push({
                        Prefix: folder
                    });
                }

                for (var i = 0; i < files.length; i++) {
                    if (files[i] != that.data.path) {
                        var file = files[i].Key.substring(
                            files[i].Key.lastIndexOf("/") + 1,
                            files[i].Key.length
                        );
                        tmp_files.push({
                            Key: file
                        });
                    }
                }

                console.log(tmp_files);
                /*      
      for(dir in dirs){
        var nonSliter=dirs[dir].Prefix.substring(0,dirs[dir].length)
        var folder=nonSliter.substring(nonSliter.lastIndexOf("/"),nonSliter.length)
        tmp_dirs.push(folder)
      }*/

                console.log(tmp_dirs);
                var file = data.Contents;
                console.log(file);
                that.setData({
                    items: tmp_dirs
                });
                that.setData({
                    files: tmp_files
                });
                that.setData({
                    path: data.Prefix
                });
            }
        );
        console.log(this.data.path);
    },
    download: function(res) {
        if (res.currentTarget.dataset.item != this.data.path) {
            console.log(res.currentTarget.dataset);
            var that = this;
            var url = this.data.cos.getObjectUrl({
                Bucket: "highschool-1256959209",
                Region: "ap-guangzhou",
                Key: that.data.path + "/" + res.currentTarget.dataset.item
            });
            var item = that.data.path + "/" + res.currentTarget.dataset.item;
            var fileName = item.substring(
                item.lastIndexOf("/") + 1,
                item.length
            );
            console.log(fileName); //判断文档、图片、视频并执行预览

            var docEnding = [
                ".docx",
                ".doc",
                ".xls",
                ".xlsx",
                ".pdf",
                ".ppt",
                ".pptx"
            ];
            var imgEnding = [".jpg", ".png", ".jpeg", ".gif"];
            var videoEnding = [""];
            var isDoc = false;
            var isImg = false;
            var isVideo = false;
            var ending = fileName.substring(
                fileName.lastIndexOf("."),
                fileName.length
            );

            for (item in docEnding) {
                if (ending == docEnding[item]) {
                    isDoc = true;
                } else if (ending == imgEnding[item]) {
                    isImg = true;
                } else if (ending == videoEnding[item]) {
                    isVideo = true;
                } else {
                    console.log(docEnding[item]);
                }
            }

            var platform = "";

            _my.getSystemInfo({
                success(sys) {
                    console.log("paltform:" + sys.platform);
                    platform = sys.platform;
                },

                fail(res) {
                    _my.showToast({
                        title: "获取系统信息失败",
                        icon: "warn",
                        duration: 2000
                    });
                }
            });

            if (
                platform == "windows" ||
                platform == "mac" ||
                platform == "pc"
            ) {
                console.log("pc设备");

                _my.showLoading({
                    title: "下载中……"
                });

                _my.downloadFile({
                    url: url,

                    success(res) {
                        console.log(res);
                        /*等待微信官方修复电脑端打开文档显示空白的bug后启用该段代码
            wx.openDocument({
              filePath: res.tempFilePath,
              fileType: ending.substring(1,ending.length),
              showMenu: true,
              success(){
                  console.log("Success Open")
              },
              complete: function(){
                wx.hideLoading()
              }
            })*/

                        _my.setClipboardData({
                            data: fileName
                        });

                        _my.saveFileToDisk({
                            filePath: res.tempFilePath,
                            success: function() {
                                console.log("Success Saved");

                                _my.showToast({
                                    title: "文件保存成功",
                                    icon: "success",
                                    duration: 2000
                                });
                            },

                            fail() {
                                _my.showToast({
                                    title: "文件保存失败",
                                    icon: "warn",
                                    duration: 2000
                                });
                            },

                            complete() {
                                _my.hideLoading();
                            }
                        });
                    }
                });
            } else {
                console.log("移动设备");

                if (isDoc) {
                    console.log("Supported Document");

                    _my.showLoading({
                        title: "下载中……"
                    });

                    _my.downloadFile({
                        url: url,

                        success(res) {
                            _my.openDocument({
                                filePath: res.tempFilePath,
                                fileType: ending.substring(1, ending.length),
                                showMenu: true,

                                success() {
                                    console.log("Success Open");
                                },

                                complete: function() {
                                    _my.hideLoading();
                                },

                                fail(res) {
                                    console.error(res);

                                    _my.showToast({
                                        title: "文件打开失败",
                                        icon: "warn",
                                        duration: 2000
                                    });
                                }
                            });
                        },

                        fail(res) {
                            console.error(res);

                            _my.showToast({
                                title: "文件下载失败",
                                icon: "warn",
                                duration: 2000
                            });
                        }
                    });
                } else if (isImg) {
                    console.log("Supported Image");

                    _my.previewImage({
                        current: url,
                        urls: [url]
                    });
                } else if (isVideo) {
                    _my.navigateTo({
                        url:
                            "../video/video?key=" +
                            res.currentTarget.dataset.item +
                            "&url=" +
                            url
                    });
                } else {
                    console.log("Unknown File");

                    _my.setClipboardData({
                        data: url,
                        success: function() {
                            _my.showModal({
                                title: "提示",
                                content:
                                    "由于微信限制，无法直接下载。链接已复制，请到手机浏览器粘贴下载。链接5分钟内有效。",
                                success: function(res) {
                                    if (res.confirm) {
                                        console.log("用户点击确定");
                                    }
                                }
                            });
                        },
                        fail: function() {
                            _my.showToast({
                                title: "链接复制失败",
                                icon: "warn",
                                duration: 2000
                            });
                        }
                    });
                }
            }
        }
    },
    pre: function(res) {
        var that = this;
        var nonSpliter = that.data.path.substring(
            0,
            that.data.path.lastIndexOf("/")
        );
        var pre_path = nonSpliter.substring(0, nonSpliter.lastIndexOf("/") + 1);
        that.setData({
            path: pre_path
        });
        that.data.cos.getBucket(
            {
                Bucket: "highschool-1256959209",

                /* 必须 */
                Region: "ap-guangzhou",

                /* 必须 */
                Prefix: that.data.path,

                /* 非必须 */
                Delimiter: "/"
                /* 非必须 */
            },
            function(err, data) {
                var dirs = data.CommonPrefixes;
                var files = data.Contents;
                var tmp_dirs = [];
                var tmp_files = [];

                for (var i = 0; i < dirs.length; i++) {
                    var nonSliter = dirs[i].Prefix.substring(
                        0,
                        dirs[i].Prefix.lastIndexOf("/")
                    );
                    var folder = nonSliter.substring(
                        nonSliter.lastIndexOf("/") + 1,
                        nonSliter.length
                    );
                    tmp_dirs.push({
                        Prefix: folder
                    });
                }

                for (var i = 0; i < files.length; i++) {
                    if (files[i] != that.data.path) {
                        var file = files[i].Key.substring(
                            files[i].Key.lastIndexOf("/") + 1,
                            files[i].Key.length
                        );
                        tmp_files.push({
                            Key: file
                        });
                    }
                }

                console.log(tmp_files);
                console.log(tmp_dirs);
                var file = data.Contents;
                console.log(file);
                that.setData({
                    items: tmp_dirs
                });
                that.setData({
                    files: tmp_files
                });
                that.setData({
                    path: data.Prefix
                });
            }
        );
        console.log(that.data.path);
    }
});
