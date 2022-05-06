// miniprogram/pages/costudy/costudy.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName:"",
    realName:"",
    showModal:false,
    agree:false,
    docList:[],
    hiddenType:false,
    btnText:"选择文件并上传",
    more:"",
    detail:"",
    hideDetail:true,
    marqueeWidth:50,
    notify:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 查看是否授权
    var that=this
    let scene=wx.getLaunchOptionsSync().scene;
    if(scene==1173){
      var forwardMaterials=wx.getLaunchOptionsSync().forwardMaterials
      console.log(wx.getLaunchOptionsSync())
      that.setData({docList: forwardMaterials,hiddenType:true,btnText:"点击立即上传"})
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },
  initNotify: function() {
    var that=this
    var pageIndex=3
    const db = wx.cloud.database()
    db.collection('info').where({tag:"notify"})  //使用
    .get({
        success(res){
          var notify=res.data[0].content[pageIndex-1]
          that.setData({notify: notify})
          that.animation = wx.createAnimation({
            duration: 750*notify.length,
            timingFunction: 'linear'
          });
          var query = wx.createSelectorQuery();
          query.select('.marquee2').boundingClientRect();
          query.exec((res) => {
            if (res[0]) {
                that.setData({
                marqueeWidth: res[0].width //文字长度
              }, () => {
                that.doAnim()
              })
            }
          })
        }
    })
  },
  doAnim: function () {
    //向左滚动到超出屏幕，这里临时写死的屏幕宽度375px
    this.animation.translate(-this.data.marqueeWidth - 375, 0).step();
    setTimeout(() => {
     this.setData({
     animationData: this.animation.export(),
     });
    }, 10)
  },
  animationend() {
    //复位
    this.animation.translate(0, 0).step({ duration: 0 });
    this.setData({
     animationData: this.animation.export()
    }, () => {
     //重新开始动画
     this.doAnim()
    });
   },   
  initCos: function () {
    var that=this
    var COS = require('../cloud/lib/cos-wx-sdk-v5.js')
    const db = wx.cloud.database();
    db.collection('info').get({
      success: function (res) {
        var Key=res.data[0].SecretKey
        var Id=res.data[0].SecretId
        var cos = new COS({
          SecretId: Id,
          SecretKey: Key
        })
        getApp().globalData.cos=cos
        getApp().globalData.COS=COS
        console.log("完成",getApp().globalData.cos)
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (options) {
    var that=this
    that.initNotify()
    //START 清除缓存文件
    var fs = wx.getFileSystemManager()
    fs.readdir({
      dirPath: `${wx.env.USER_DATA_PATH}`,
      success(res) {
        var listFile=res.files
        for(var index in listFile){
          if(listFile[index] != "miniprogramLog"){
            var tmpPath=`${wx.env.USER_DATA_PATH}/`+ listFile[index]
            fs.unlink({
              filePath: tmpPath,
              success(res){console.log(res)},
              fail(res){console.error(res)}
            })
          }
        }
      },
      fail(res) {
        console.error(res)
      }
    })
    //END 清除缓存文件
    wx.getStorage({
      key: 'realname',
      success (res) {
        if(res.data!=undefined){
          console.log("真实姓名",res.data)
          that.setData({realName:res.data})
        }
      },
      fail: function(res) {
        console.error(res)
      }
    })
    if(typeof(getApp().globalData.cos)=="undefined"){
      this.initCos()
    }else{
      console.log("已有cos对象")
    }
    wx.getSetting({
      success (res){
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: function(res) {
              console.log(res.userInfo.nickName)
              that.setData({nickName:res.userInfo.nickName})
            }
          })
        }
      }
    })
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

  onChooseFile: function(){
    if(this.data.nickName != ""){
      this.onConfirm()
    }else{
      wx.showModal({
        title: "登陆失败",
        content: "请重试或联系开发者。"
      })
    }
  },

  showDialogBtn: function() {
    this.setData({
      showModal: true
    })
  },
  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: function () {
  },
  /**
   * 隐藏模态对话框
   */
  hideModal: function () {
    this.setData({
      showModal: false
    });
  },
  /**
   * 对话框取消按钮点击事件
   */
  onCancel: function () {
    this.hideModal();
    this.setData({
      agree: false
    })
  },
  /**
   * 对话框确认按钮点击事件
   */
  onConfirm: function () {
    if(this.data.realName != ""){
      uploadDocument(this);
      this.hideModal();
    }else{
      wx.showModal({
        title: "提示",
        content: "请填写您的真实姓名。"
      })
    }
  },

  inputChange: function(res){
    wx.setStorage({key:"realname",data:res.detail.value})
    this.setData({realName: res.detail.value})
  },

  formSubmit: function(res){
    console.log(res)
    this.setData({more:res.detail.value.more})
    if(res.detail.value.name==""){
      wx.showModal({
        title: "提示",
        content: "请填写您的真实姓名",
        showCancel: false
      })
    }else if(res.detail.value.radio=="disagree"){
      wx.showModal({
        title: "提示",
        content: "需要选择“同意”才能进行下一步。",
        showCancel: false
      })
    }else if(res.detail.value.radio==""){
      wx.showModal({
        title: "提示",
        content: "请阅读并同意资料共享约定",
        showCancel: false
      })
    }else if(res.detail.value.more==""){
      wx.showModal({
        title: "提示",
        content: "请填写内容概述",
        showCancel: false
      })
    }else{
      //上传文件
      if(this.data.nickName != ""){
        if(this.data.docList.length>0){
          //从其它文档直接打开
          console.log("其它文档打开")
          uploadDocument(this,"all",this.data.docList);
        }else{
          uploadDocument(this,"all",this.data.docList);
        }
      }else{
        wx.hideLoading()
        wx.showModal({
          title: "登陆失败",
          content: "请重试或联系开发者。",
          showCancel: false
        })
      }
    }
  },
  viewFile: function() {
    getApp().globalData.bucket="costudy-1256959209"
    getApp().globalData.path = "";
    wx.navigateTo({
      url: '../cloud2/cloud',
    })
  },
  detail: function(res) {
    if(this.data.detail==""){
      this.setData({detail:"请认真阅读本约定内容后再点击上传。\n"+
      "1.为了保证资料共享的质量，防止不正当使用，我们将登记你的真实姓名和微信昵称，请如实填写相关信息。\n"+
      "2.严禁上传非法内容，目前只允许上传文档类型的文件。\n"+
      "3.请填写好“内容概述”，将作为资料分类的依据\n"+
      "4.由于微信官方限制，小程序内仅支持从聊天记录中选择文件进行上传，上传时可以先将文档发送到“文件传输助手”，再选择从文件传输助手中上传文件。",hideDetail:false})
    }else{
      this.setData({detail:"",hideDetail:true})
    }
  }
})

function uploadDocument(that,type,items){
  var summary = that.data.more
  var folder = '投稿上传/'+summary+"/";
  var cos = getApp().globalData.cos
  cos.getBucket({
    Bucket: 'costudy-1256959209',
    Region: 'ap-guangzhou',
    Prefix: folder,           /* Prefix表示列出的object的key以prefix开始，非必须 */
  }, function(err, data) {
      console.log(err || data);
      if(data.Contents.length > 0){
        wx.showModal({
          title: "提示",
          content: "同名文件夹已存在，无法上传。",
          showCancel: false
        })
        return
      }else{
        if(items.length==0){
          console.log("choose file")
          wx.chooseMessageFile({
            count: 100,
            type: "all",
            success (res) {
              wx.showLoading({
                title: '文件上传中...',
              })
              var totalSize = 0
              var names = ""
              var len = res.tempFiles.length
              var totalSize = 0
              var names = ""
              for(let i=0;i<len;i++){
                var tempFilePath=res.tempFiles[i]
                console.log(tempFilePath)
                cos.postObject({
                    Bucket: 'costudy-1256959209',
                    Region: 'ap-guangzhou',
                    Key: folder + tempFilePath.name,
                    FilePath: tempFilePath.path,
                    onProgress: function(progressData) {
                      var percentage=(progressData.percent)*100
                      console.log(percentage);
                      that.setData({percent: percentage})
                      if(progressData.percent==1){
                        that.setData({percent: 0})
                      }
                    }
                }, function(err, data) {
                  if(err){
                    wx.hideLoading()
                    wx.showModal({
                      title: '文件上传失败',
                      content: JSON.stringify(err)
                    })
                  }else{
                    //文件上传成功
                    var size=tempFilePath.size
                    console.log(data);
                    totalSize=totalSize+size
                    console.log(tempFilePath.name)
                    names=names+"\n - "+decodeURI(data.Location.replace("costudy-1256959209.cos.ap-guangzhou.myqcloud.com/%E6%8A%95%E7%A8%BF%E4%B8%8A%E4%BC%A0/",""))
                    if(i==len-1){
                      var size=totalSize
                      var vSize=""
                      if(size>1024*1024*1024){
                        vSize=(size/1024/1024/1024).toFixed(2)+"GB"
                      }else if(size>1024*1024){
                        vSize=(size/1024/1024).toFixed(2)+"MB"
                      }else if(size>1024){
                        vSize=(size/1024).toFixed(2)+"KB"
                      }else{
                        vSize=size+"字节"
                      }
                      var myDate = new Date();
                      wx.request({
                        url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=74502143-4f97-47ae-b4fa-578144c39417',
                        data: {
                          "msgtype": "markdown",
                          "markdown": {
                              "content": "**新文件上传通知**,详情如下：\n"+
                                        "**文件列表：** "+names+"\n"+
                                        "> 总大小："+vSize+"\n"+
                                        "> 上传用户：`"+that.data.nickName+"`\n"+
                                        "> 上传者：<font color='green'>"+that.data.realName+"</font>\n"+
                                        "> 上传时间： "+myDate.toLocaleString()+"\n"+
                                        "> 文件数量： "+len+"\n"+
                                        "**备注信息：**"+that.data.more
                          }
                        },
                        method: "POST",
                        fail: function(res){
                          wx.hideLoading()
                          wx.showModal({
                            title: '信息登记失败',
                            content: "请联系开发者（点击“关于程序”菜单查看）"
                          })
                        },
                        success: function(res){
                          wx.hideLoading()
                          wx.navigateTo({
                            url: './success/success',
                          })
                          /*wx.showModal({
                            title: '链接登记成功',
                            content: "您的贡献将尽早并入主资料库。谢谢您的分享！"
                          })*/
                        }
                      })
                    }
                  }
                });
              }
            }
          })
        }else{
          console.log("Doc material open")
          //直接从文档打开小程序 场景值1173
          wx.showLoading({
            title: '正在上传文件',
          })
          var totalSize = 0
          var names = ""
          var len = items.length//文件数量 即文件列表的长度
          var totalSize = 0
          var names = ""
          var myDate = new Date();
          for(let i=0;i<len;i++){
            var tempFilePath=items[i]
            var html=false
            if(tempFilePath.type=="text/html"){
              html=true
            }
            console.log(tempFilePath)
            if(html){
              var url=tempFilePath.path
              console.log(url)
              cos.getObject({
                Bucket: 'costudy-1256959209', /* 必须 */
                Region: 'ap-guangzhou',     /* 存储桶所在地域，必须字段 */
                Key: '链接投稿.csv', 
              }, function(err, data) {
                console.log(err || data.Body);
                if(data){
                  cos.putObject({
                    Bucket: 'costudy-1256959209', /* 必须 */
                    Region: 'ap-guangzhou',     /* 存储桶所在地域，必须字段 */
                    Key: '链接投稿.csv',             /* 必须 */
                    Body: data.Body+'\n'+url+","+that.data.realName+","+myDate.toLocaleString()+","+that.data.more,
                  }, function(err, data) {
                      console.log(err || data);
                  });
                }
              });
              wx.request({
                url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=74502143-4f97-47ae-b4fa-578144c39417',
                data: {
                  "msgtype": "markdown",
                  "markdown": {
                      "content": "**新链接收藏通知**,详情如下：\n"+
                                "**链接地址：** ["+url+"]("+url+") \n"+
                                "> 上传用户：`"+that.data.nickName+"`\n"+
                                "> 上传者：<font color='green'>"+that.data.realName+"</font>\n"+
                                "> 上传时间： "+myDate.toLocaleString()+"\n"+
                                "**备注信息：**"+that.data.more
                  }
                },
                method: "POST",
                fail: function(res){
                  wx.hideLoading()
                  wx.showModal({
                    title: '信息登记失败',
                    content: "请联系开发者（点击“关于程序”菜单查看）"
                  })
                },
                success: function(res){
                  wx.hideLoading()
                  wx.navigateTo({
                    url: './success/success',
                  })
                  /*wx.showModal({
                    title: '链接登记成功',
                    content: "您的贡献将尽早并入主资料库。谢谢您的分享！"
                  })*/
                }
              })
            }else{
              cos.postObject({
                  Bucket: 'costudy-1256959209',
                  Region: 'ap-guangzhou',
                  Key: folder + tempFilePath.name,
                  FilePath: tempFilePath.path,
                  onProgress: function(progressData) {
                    var percentage=(progressData.percent)*100
                    console.log(percentage);
                    that.setData({percent: percentage})
                    if(progressData.percent==1){
                      that.setData({percent: 0})
                    }
                  }
              }, function(err, data) {
                if(err){
                  wx.hideLoading()
                  wx.showModal({
                    title: '文件上传失败',
                    content: JSON.stringify(err)
                  })
                }else{
                  //文件上传成功
                  var size=tempFilePath.size
                  console.log(data);
                  totalSize=totalSize+size
                  console.log(tempFilePath.name)
                  names=names+"\n - "+decodeURI(data.Location.replace("costudy-1256959209.cos.ap-guangzhou.myqcloud.com/%E6%8A%95%E7%A8%BF%E4%B8%8A%E4%BC%A0/",""))
                  if(i==len-1){
                    var size=totalSize
                    var vSize=""
                    if(size>1024*1024*1024){
                      vSize=(size/1024/1024/1024).toFixed(2)+"GB"
                    }else if(size>1024*1024){
                      vSize=(size/1024/1024).toFixed(2)+"MB"
                    }else if(size>1024){
                      vSize=(size/1024).toFixed(2)+"KB"
                    }else{
                      vSize=size+"字节"
                    }
                    wx.request({
                      url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=74502143-4f97-47ae-b4fa-578144c39417',
                      data: {
                        "msgtype": "markdown",
                        "markdown": {
                            "content": "**新文件上传通知**,详情如下：\n"+
                                      "**文件列表：** "+names+"\n"+
                                      "> 总大小："+vSize+"\n"+
                                      "> 上传用户：`"+that.data.nickName+"`\n"+
                                      "> 上传者：<font color='green'>"+that.data.realName+"</font>\n"+
                                      "> 上传时间： "+myDate.toLocaleString()+"\n"+
                                      "> 文件数量： "+len+"\n"+
                                      "**备注信息：**"+that.data.more
                        }
                      },
                      method: "POST",
                      fail: function(res){
                        wx.hideLoading()
                        wx.showModal({
                          title: '信息登记失败',
                          content: "请联系开发者（点击“关于程序”菜单查看）"
                        })
                      },
                      success: function(res){
                        wx.hideLoading()
                        wx.navigateTo({
                          url: './success/success',
                        })
                        /*wx.showModal({
                          title: '链接登记成功',
                          content: "您的贡献将尽早并入主资料库。谢谢您的分享！"
                        })*/
                      }
                    })
                  }
                }
              });
            }
          }
        }
      }
  });
}