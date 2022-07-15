// miniprogram/pages/about/about.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    date: 2022,
    size: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const db = wx.cloud.database();
    const that=this
    db.collection('countDown').get({
      success: function(res) {
        if(res.data.length==0){
          //空数据
        }else{
          //更新数据
          that.setData({
            date: res.data[0].year
          })
        }
        console.log(res)        
      }
    })
    wx.getStorage({
        key: 'savedSize',
        success (res) {
          console.log(res.data)
          that.setData({size: that.unitTransform(res.data)})
        },
        fail:function(res) {
                                     
        }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  clear: function(res) {
      //START 清除缓存文件
    var fs = wx.getFileSystemManager()
    fs.readdir({
      dirPath: `${wx.env.USER_DATA_PATH}`,
      success(res) {
        var listFile=res.files
        if(listFile.length<=0){
            wx.showModal({
              title:"清除缓存",
              content:"无需清除缓存",
              showCancel:false
            })
        }
        for(var index in listFile){
          if(listFile[index] != "miniprogramLog"){
            var tmpPath=`${wx.env.USER_DATA_PATH}/`+ listFile[index]
            fs.unlink({
              filePath: tmpPath,
              success(res){console.log(res)},
              fail(res){console.error(res)}
            })
            if(index>=listFile.length-1){
                wx.showModal({
                  title:"清除缓存",
                  content:"缓存清除成功",
                  showCancel:false
                })
            }
          }
        }
      },
      fail(res) {
        console.error(res)
      }
    })
    //END 清除缓存文件
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  github: function(res) {
    wx.setClipboardData({
        data: 'https://github.com/xnbx2012/PeterCoding',
        success (res) {
            wx.hideToast()
          wx.getClipboardData({
            success (res) {
                wx.showModal({
                  title:"GitHub",
                  content:"GitHub地址已复制，请粘贴到浏览器查看。记得Star哦！",
                  showCancel:false
                })
              console.log(res.data) // data
            }
          })
        }
      })
  },
  githee: function(res) {
    wx.setClipboardData({
        data: 'https://gitee.com/PeterZhong1219/peter-coding',
        success (res) {
            wx.hideToast()
          wx.getClipboardData({
            success (res) {
                wx.showModal({
                  title:"Gitee",
                  content:"Gitee地址已复制，请粘贴到浏览器查看。",
                  showCancel:false
                })
              console.log(res.data) // data
            }
          })
        }
      })
  },

  onChooseFile: function(){
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success (res) {
        // tempFilePath可以作为img标签的src属性显示图片
        wx.showLoading({
          title: '文件上传中...',
        })
        const tempFilePath = res.tempFiles[0]
        console.log(tempFilePath)
        var folder = '投稿上传/';
        var COS = require('../cloud/lib/cos-wx-sdk-v5.js')
        var cos = new COS({
          SecretId: 'AKIDFI5qNcYKo32lY7lQAD0XnGbkpdEaikNl',
          SecretKey: 'IL9j49ys0oMceRxDRQ8bpqdOzXs0s8Ax',
        })
        cos.postObject({
            Bucket: 'costudy-1256959209',
            Region: 'ap-guangzhou',
            Key: folder + tempFilePath.name,              /* 必须 */
            FilePath: tempFilePath.path, // wx.chooseImage 选择文件得到的 tmpFilePath
            onProgress: function(progressData) {
                console.log(JSON.stringify(progressData));
            }
        }, function(err, data) {
          wx.hideLoading()
          if(err){
            wx.showModal({
              title: '文件上传失败',
              content: JSON.stringify(err)
            })
          }else{
            wx.showModal({
              title: '文件上传成功',
              content: "请及时告知群主以便尽快将文件并入主资料库。谢谢您的分享！"
            })
            wx.request({
              url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=74502143-4f97-47ae-b4fa-578144c39417',
              data: {
                "msgtype": "markdown",
                "markdown": {
                    "content": "**新文件上传通知**,详情如下：\n"+
                              "> **文件名：** `"+tempFilePath.name+"`\n"+
                              "> 文件大小："+tempFilePath.size+"\n"+
                              "> 时间戳："+tempFilePath.time+"\n"
                }
              },
              method: "POST",
              fail: function(res){
                console.log(res)
              },
              success: function(res){
                console.log(res)
              }
            })
          }
          console.log(err || data);
        });
      }
    })
  },

  version: function() {
    wx.showModal({
      showCancel: false,
      title: "彩蛋",
      content: "恭喜你发现了一个暂时没有功能的彩蛋！"
    })
  },

  bindDateChange: function(res) {
    var year = res.detail.value
    const db = wx.cloud.database();
    this.setData({
      date: year
    })
    db.collection('countDown').get({
      success: function(res) {
        if(res.data.length==0){
          //新增数据
          db.collection('countDown').add({
            data:{
              year: year
            }
          })
        }else{
          //更新数据
          db.collection('countDown').where({_id:res.data[0]._id}).update({
            data:{
              year: year
            }
          })
        }
        console.log(res)        
      }
    })
  },

  unitTransform: function(bite) {
    var result=bite.toFixed(2)+"字节" 
    if(bite>1024*1024*1024){ //GB
        result=(bite/(1024*1024*1024)).toFixed(2)+"GB"
    }else if(bite>1024*1024){ //MB
        result=(bite/(1024*1024)).toFixed(2)+"MB"
    }else if(bite>1024){ //KB
        result=(bite/(1024)).toFixed(2)+"KB"
    }
    return result
  }
})