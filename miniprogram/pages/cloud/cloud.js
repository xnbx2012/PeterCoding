// miniprogram/pages/cloud/cloud.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    path: "",
    cos:{},
    items:[],
    files:[],
    COS:{},
    hideRipple:true,
    showActionsheet: false,
    url:"",
    audioContext:{},
    showMore:false,
    showDownloadModal:false,
    img_list:[]
  },
  sleep: function (numberMillis) { 
    var now = new Date(); 
    var exitTime = now.getTime() + numberMillis; 
    while (true) { 
      now = new Date(); 
      if (now.getTime() > exitTime) 
      return; 
    } 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({title: '正在初始化'})
    var that=this
    if(typeof(options.path)!="undefined"){
      this.setData({path:options.path})
    }else{
      this.setData({path: ""})
    }
    wx.hideLoading()
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
    wx.showLoading({title: '获取文件列表'})
    var that = this
    if(wx.canIUse('startDeviceMotionListening')){
      wx.startDeviceMotionListening()
      wx.onDeviceMotionChange(function(res){
        that.resize()
      })
    }
    if(wx.canIUse('onCopyUrl')){
      wx.onCopyUrl(function(res){
        return { query: 'path='+that.data.path }
      })
    }
    const db = wx.cloud.database();
    db.collection('info').get({
      success: function (res) {
        if(typeof(getApp().globalData.cos)=="undefined"){
          var Key=res.data[0].SecretKey
          var Id=res.data[0].SecretId
          var COS = require('../cloud/lib/cos-wx-sdk-v5.js')
          var cos = new COS({
            SecretId: Id,
            SecretKey: Key
          })
          getApp().globalData.cos=cos
          getApp().globalData.COS=COS
          that.setData({COS:COS})
          that.setData({cos:cos})
        }else{
          if(typeof(getApp().globalData.cos)!="undefined") console.log("已有cos对象")
          that.setData({COS:getApp().globalData.COS})
          that.setData({cos:getApp().globalData.cos})
        }        
        getApp().globalData.cos.getBucket({
          Bucket: 'highschool-1256959209',
          Region: 'ap-guangzhou',
          Prefix: that.data.path,
          Delimiter: "/",
        }, function(err, data) {
          var dirs=data.CommonPrefixes
          var files=data.Contents
          var tmp_dirs=[]
          var tmp_files=[]
          for (var i = 0; i < dirs.length; i++) {
            var nonSliter=dirs[i].Prefix.substring(0,dirs[i].Prefix.lastIndexOf("/"))
            var folder=nonSliter.substring(nonSliter.lastIndexOf("/")+1,nonSliter.length)
            tmp_dirs.push({Prefix:folder})
          }
          for(var i=0; i < files.length; i++){
            if(files[i] != that.data.path){
              var file=files[i].Key.substring(files[i].Key.lastIndexOf("/")+1,files[i].Key.length)
              tmp_files.push({Key:file})
            }
          }
          that.setData({items: tmp_dirs})
          that.setData({files: tmp_files})
          wx.hideLoading()
          wx.stopPullDownRefresh()
        });        
      }
    })
    //wx.hideLoading()
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
  onShareAppMessage: function (){
    let url = encodeURIComponent('/pages/cloud/cloud?path=' + this.data.path)
    var path=this.data.path
    var fileName=path.substring(0,path.lastIndexOf("/"))
    var fileNameFinal=fileName.substring(fileName.lastIndexOf("/")+1,fileName.length)
    return {
      title: "学习资料："+fileNameFinal,
      path: "/pages/cloud/cloud?path="+this.data.path
    }
  },
  onPullDownRefresh:function() {
    this.onShow({})
  },

  selected: function(res){
    wx.showLoading({
      title: '正在加载目录',
    })
    var that = this
    //that.setData({path:that.data.path+res.currentTarget.dataset.item+"/"})
    getApp().globalData.path = res.currentTarget.dataset.item+"/";
    getApp().globalData.bucket = "highschool-1256959209"
    wx.navigateTo({
      url: '../cloud2/cloud',
      query: "path="+res.currentTarget.dataset.item+"/"
    })
    /*this.data.cos.getBucket({
      Bucket: 'highschool-1256959209', /* 必须 
      Region: 'ap-guangzhou',    /* 必须 
      Prefix: that.data.path,              /* 非必须 
      Delimiter: '/',            /* 非必须 
   }, function(err, data) {
      var dirs=data.CommonPrefixes
      var files=data.Contents
      var tmp_dirs=[]
      var tmp_files=[]
      for (var i = 0; i < dirs.length; i++) {
        var nonSliter=dirs[i].Prefix.substring(0,dirs[i].Prefix.lastIndexOf("/"))
        var folder=nonSliter.substring(nonSliter.lastIndexOf("/")+1,nonSliter.length)
        tmp_dirs.push({Prefix:folder})
      }
      for(var i=0; i < files.length; i++){
        if(files[i] != that.data.path){
          var file=files[i].Key.substring(files[i].Key.lastIndexOf("/")+1,files[i].Key.length)
          tmp_files.push({Key:file})
        }
      }
      /*      
      for(dir in dirs){
        var nonSliter=dirs[dir].Prefix.substring(0,dirs[dir].length)
        var folder=nonSliter.substring(nonSliter.lastIndexOf("/"),nonSliter.length)
        tmp_dirs.push(folder)
      }
      var file=data.Contents
      that.setData({items: tmp_dirs})
      that.setData({files: tmp_files})
      that.setData({path: data.Prefix})
   });
    console.info("已选择目录："+this.data.path);*/
    wx.hideLoading()
  },

  download: function(res){
    if(res.currentTarget.dataset.item!=this.data.path){
      wx.showLoading({title: '初始化下载信息'})
      var that=this
      var url = this.data.cos.getObjectUrl({
        Bucket: 'highschool-1256959209',
        Region: 'ap-guangzhou',
        Key: that.data.path+"/"+res.currentTarget.dataset.item
      });
      var item=that.data.path+"/"+res.currentTarget.dataset.item
      var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
      console.log("已单击文件："+fileName)

      //判断文档、图片、视频并执行预览
      var docEnding=[".docx",".doc",".xls",".xlsx",".pdf",".ppt",".pptx",".txt",".log",".js",".html",".css",".java",".py",".csv"]
      var imgEnding=[".jpg",".png",".jpeg",".gif"]
      var videoEnding=[".mp3",".wav",".flac"]
      var isDoc=false
      var isImg=false
      var isVideo=false
      var pause=true
      var img_list=[]
      var ending=fileName.substring(fileName.lastIndexOf("."),fileName.length)
      for(item in docEnding){
        if(ending==docEnding[item]){
          isDoc=true
        }else if(ending==imgEnding[item]){
          isImg=true
          this.data.cos.getBucket({
            Bucket: 'highschool-1256959209', /* 填入您自己的存储桶，必须字段 */
            Region: 'ap-guangzhou',  /* 存储桶所在地域，例如ap-beijing，必须字段 */
            Prefix: that.data.path,           /* Prefix表示列出的object的key以prefix开始，非必须 */
            Delimiter: '/'
          }, function(err, data) {
            if (err) {
              return console.log('list error:', err);
            } else {
                var arr=data.Contents
                for (let i = 0, len = arr.length; i < len; i++) {
                  var item=arr[i]
                  var img_key=item.Key
                  var tmp_url = that.data.cos.getObjectUrl({
                    Bucket: 'highschool-1256959209',
                    Region: 'ap-guangzhou',
                    Key: img_key
                  });
                  img_list[i]=tmp_url
                }
                that.setData({img_list: img_list})
                pause=false
            }
          });
        }else if(ending==videoEnding[item]){
          isVideo=true
        }else{

        }
      }

      var platform=""
      wx.getSystemInfo({
        success(sys){
          platform=sys.platform
        },
        fail(res){
          wx.showToast({
            title: '获取系统信息失败',
            icon: "loading",
            duration: 2000
          })
        }
      })

      var pc=false
      if(platform == "windows" || platform=="mac" || platform=="pc"){
        if(ending==".ppt",".pptx",".xls",".xlsx"){
          wx.showModal({
            title:"提示",
            content:"电脑版微信暂不支持，请用手机打开。",
            showCancel: false
          })
        }
        pc=true
      }

      wx.hideLoading()
      if(pc){   
        var downloadTask=wx.downloadFile({
          url: url,
          success (res) {
            wx.setClipboardData({
              data: fileName,
            })
            wx.saveFileToDisk({
              filePath: res.tempFilePath,
              success: function(){
                wx.showToast({
                  title: '文件保存成功',
                  icon: 'success',
                  duration: 2000
                })
              },
              fail(){
                wx.showToast({
                  title: '文件保存失败',
                  icon: 'loading',
                  duration: 2000
                })
              },
              complete(){
                
              }
            })
          },
          fail: function(res){
          }
        })
      }else{
        if(isDoc){
          that.setData({
            showDownloadModal:true,
            downloadPercent:0
          })
          wx.getSavedFileList({
            success (res) {
              console.log(res.fileList)
            }
          })
          const basepath = `${wx.env.USER_DATA_PATH}/`
          var downloadTask=wx.downloadFile({
            url: url,
            filePath: basepath+fileName,
            success (res) {
                wx.openDocument({
                    filePath: res.filePath,
                    fileType: ending.substring(1,ending.length),
                    showMenu: true,
                    success(){
                    },
                    complete: function(){
                      wx.hideLoading()
                    },
                    fail(res){
                      wx.showModal({
                        title: '文件打开失败',
                        content: JSON.stringify(res)+"请截图联系开发者"
                      })
                    }
                })
            },
            fail(res){
              wx.showModal({
                title: '文件下载失败',
                content: res
              })
            },
            complete(){
              that.setData({
                showDownloadModal:false,
                downloadPercent:0
              })
            }
          })
          downloadTask.onProgressUpdate(function(res){
            console.log(res)
            var progress=res.progress
            var totalMb=res.totalBytesExpectedToWrite/1024/1024
            var writtenMb=res.totalBytesWritten/1024/1024
            totalMb=totalMb.toFixed(2)
            writtenMb=writtenMb.toFixed(2)
            that.setData({
              downloadPercent: progress,
              totalMb: totalMb,
              writtenMb: writtenMb
            })
          })
        }else if(isImg){
          wx.showLoading({
            title: '加载中...',
          })
          setTimeout(function () {
            wx.hideLoading()
            var imgUrls=img_list.valueOf()
            wx.previewImage({
              current: url,
              urls: imgUrls
            })
          }, 5000);
        }else if(isVideo){
          //判断为音频文件，则打开模态进行播放
          const basepath = `${wx.env.USER_DATA_PATH}/`
          wx.downloadFile({
            url: url,
            filePath: basepath+fileName,
            success (res) {
              if (res.statusCode === 200) {
                var filePath=basepath+fileName
                var audioContext=wx.createInnerAudioContext()
                audioContext.src=filePath
                audioContext.onTimeUpdate(function(){
                  var currentTime=Math.round(audioContext.currentTime)
                  var duration=Math.round(audioContext.duration)
                  var percent=(currentTime/duration)*100
                  that.setData({
                    musicPercent:percent,
                    duration:duration,
                    currentTime:currentTime
                  })
                })
                audioContext.onEnded(function(){
                  var duration=Math.round(audioContext.duration)
                  that.setData({currentTime:duration})
                })
                audioContext.onPlay(function(){
                  var currentTime=Math.round(audioContext.currentTime)
                  var duration=Math.round(audioContext.duration)
                  var percent=(currentTime/duration)*100
                  that.setData({
                    musicPercent:percent,
                    duration:duration,
                    currentTime:currentTime
                  })
                })
                audioContext.onPause(function(){
                  var currentTime=Math.round(audioContext.currentTime)
                  var duration=Math.round(audioContext.duration)
                  var percent=(currentTime/duration)*100
                  that.setData({
                    musicPercent:percent,
                    duration:duration,
                    currentTime:currentTime
                  })
                })
                that.setData({audioContext:audioContext})
                that.showModal()
              }
            }
          })
        }else{
          wx.setClipboardData({
            data: url,
            success: function(){
              wx.showModal({
                title: '提示' ,
                content: '由于微信限制，无法直接下载。链接已复制，请到手机浏览器粘贴下载。链接5分钟内有效。' ,
                success: function (res) {
                if (res.confirm) {
                }
                }
              })
            },
            fail: function(){
              wx.showToast({
                title: '链接复制失败',
                icon: 'loading',
                duration: 2000
              })
            }
          })
        }
      }
    }
  },

  search_download: function(res){
    if(res.currentTarget.dataset.item!=this.data.path){
      console.log("进入搜索后下载回调")
      wx.showLoading({title: '初始化下载信息'})
      var that=this
      var url = this.data.cos.getObjectUrl({
        Bucket: 'highschool-1256959209',
        Region: 'ap-guangzhou',
        Key: res.currentTarget.dataset.item
      });
      var item=res.currentTarget.dataset.item
      var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
      console.log("已单击文件："+fileName)

      //判断文档、图片、视频并执行预览
      var docEnding=[".docx",".doc",".xls",".xlsx",".pdf",".ppt",".pptx",".txt",".log",".js",".html",".css",".java",".py",".csv"]
      var imgEnding=[".jpg",".png",".jpeg",".gif"]
      var videoEnding=[".mp3",".wav",".flac"]
      var isDoc=false
      var isImg=false
      var isVideo=false
      var pause=true
      var img_list=[]
      var ending=fileName.substring(fileName.lastIndexOf("."),fileName.length)
      for(item in docEnding){
        if(ending==docEnding[item]){
          isDoc=true
        }else if(ending==imgEnding[item]){
          isImg=true
        }else if(ending==videoEnding[item]){
          isVideo=true
        }else{

        }
      }

      /*var platform=""
      wx.getSystemInfo({
        success(sys){
          platform=sys.platform
        },
        fail(res){
          wx.showToast({
            title: '获取系统信息失败',
            icon: "loading",
            duration: 2000
          })
        }
      })*/

      if(isDoc){
        that.setData({
          showDownloadModal:true,
          downloadPercent:0
        })
        wx.getSavedFileList({
          success (res) {
            console.log(res.fileList)
          }
        })
        const basepath = `${wx.env.USER_DATA_PATH}/`
        var downloadTask=wx.downloadFile({
          url: url,
          filePath: basepath+fileName,
          success (res) {
              wx.openDocument({
                  filePath: res.filePath,
                  fileType: ending.substring(1,ending.length),
                  showMenu: true,
                  success(){
                  },
                  complete: function(){
                    wx.hideLoading()
                  },
                  fail(res){
                    wx.showModal({
                      title: '文件打开失败',
                      content: res
                    })
                  }
              })
          },
          fail(res){
            wx.showModal({
              title: '文件下载失败',
              content: res
            })
          },
          complete(){
            that.setData({
              showDownloadModal:false,
              downloadPercent:0
            })
          }
        })
        downloadTask.onProgressUpdate(function(res){
          var progress=res.progress
          var totalMb=res.totalBytesExpectedToWrite/1024/1024
          var writtenMb=res.totalBytesWritten/1024/1024
          totalMb=totalMb.toFixed(2)
          writtenMb=writtenMb.toFixed(2)
          that.setData({
            downloadPercent: progress,
            totalMb: totalMb,
            writtenMb: writtenMb
          })
        })
      }else if(isImg){
        wx.showLoading({
          title: '加载中...',
        })
        setTimeout(function () {
          wx.hideLoading()
          var imgUrls=img_list.valueOf()
          wx.previewImage({
            current: url,
            urls: imgUrls
          })
        }, 5000);
      }else if(isVideo){
        //判断为音频文件，则打开模态进行播放
        const basepath = `${wx.env.USER_DATA_PATH}/`
        wx.downloadFile({
          url: url,
          filePath: basepath+fileName,
          success (res) {
            if (res.statusCode === 200) {
              var filePath=basepath+fileName
              var audioContext=wx.createInnerAudioContext()
              audioContext.src=filePath
              audioContext.onTimeUpdate(function(){
                var currentTime=Math.round(audioContext.currentTime)
                var duration=Math.round(audioContext.duration)
                var percent=(currentTime/duration)*100
                that.setData({
                  musicPercent:percent,
                  duration:duration,
                  currentTime:currentTime
                })
              })
              audioContext.onEnded(function(){
                var duration=Math.round(audioContext.duration)
                that.setData({currentTime:duration})
              })
              audioContext.onPlay(function(){
                var currentTime=Math.round(audioContext.currentTime)
                var duration=Math.round(audioContext.duration)
                var percent=(currentTime/duration)*100
                that.setData({
                  musicPercent:percent,
                  duration:duration,
                  currentTime:currentTime
                })
              })
              audioContext.onPause(function(){
                var currentTime=Math.round(audioContext.currentTime)
                var duration=Math.round(audioContext.duration)
                var percent=(currentTime/duration)*100
                that.setData({
                  musicPercent:percent,
                  duration:duration,
                  currentTime:currentTime
                })
              })
              that.setData({audioContext:audioContext})
              that.showModal()
            }
          }
        })
      }else{
        wx.setClipboardData({
          data: url,
          success: function(){
            wx.showModal({
              title: '提示' ,
              content: '由于微信限制，无法直接下载。链接已复制，请到手机浏览器粘贴下载。链接5分钟内有效。' ,
              success: function (res) {
              if (res.confirm) {
              }
              }
            })
          },
          fail: function(){
            wx.showToast({
              title: '链接复制失败',
              icon: 'loading',
              duration: 2000
            })
          }
        })
      }

      /*var pc=false
      if(platform == "windows" || platform=="mac" || platform=="pc"){
        pc=false
      }
      pc=false//暂时屏蔽PC与手机端不同的逻辑

      wx.hideLoading()
      if(pc){   
        console.log("PC")
        var downloadTask=wx.downloadFile({
          url: url,
          success (res) {
            wx.setClipboardData({
              data: fileName,
            })
            wx.saveFileToDisk({
              filePath: res.tempFilePath,
              success: function(){
                wx.showToast({
                  title: '文件保存成功',
                  icon: 'success',
                  duration: 2000
                })
              },
              fail(){
                wx.showToast({
                  title: '文件保存失败',
                  icon: 'loading',
                  duration: 2000
                })
              },
              complete(){
                
              }
            })
          },
          fail: function(res){
          }
        })
      }else{
        if(isDoc){
          that.setData({
            showDownloadModal:true,
            downloadPercent:0
          })
          wx.getSavedFileList({
            success (res) {
              console.log(res.fileList)
            }
          })
          const basepath = `${wx.env.USER_DATA_PATH}/`
          var downloadTask=wx.downloadFile({
            url: url,
            filePath: basepath+fileName,
            success (res) {
                wx.openDocument({
                    filePath: res.filePath,
                    fileType: ending.substring(1,ending.length),
                    showMenu: true,
                    success(){
                    },
                    complete: function(){
                      wx.hideLoading()
                    },
                    fail(res){
                      wx.showModal({
                        title: '文件打开失败',
                        content: res
                      })
                    }
                })
            },
            fail(res){
              wx.showModal({
                title: '文件下载失败',
                content: res
              })
            },
            complete(){
              that.setData({
                showDownloadModal:false,
                downloadPercent:0
              })
            }
          })
          downloadTask.onProgressUpdate(function(res){
            var progress=res.progress
            var totalMb=res.totalBytesExpectedToWrite/1024/1024
            var writtenMb=res.totalBytesWritten/1024/1024
            totalMb=totalMb.toFixed(2)
            writtenMb=writtenMb.toFixed(2)
            that.setData({
              downloadPercent: progress,
              totalMb: totalMb,
              writtenMb: writtenMb
            })
          })
        }else if(isImg){
          wx.showLoading({
            title: '加载中...',
          })
          setTimeout(function () {
            wx.hideLoading()
            var imgUrls=img_list.valueOf()
            wx.previewImage({
              current: url,
              urls: imgUrls
            })
          }, 5000);
        }else if(isVideo){
          //判断为音频文件，则打开模态进行播放
          const basepath = `${wx.env.USER_DATA_PATH}/`
          wx.downloadFile({
            url: url,
            filePath: basepath+fileName,
            success (res) {
              if (res.statusCode === 200) {
                var filePath=basepath+fileName
                var audioContext=wx.createInnerAudioContext()
                audioContext.src=filePath
                audioContext.onTimeUpdate(function(){
                  var currentTime=Math.round(audioContext.currentTime)
                  var duration=Math.round(audioContext.duration)
                  var percent=(currentTime/duration)*100
                  that.setData({
                    musicPercent:percent,
                    duration:duration,
                    currentTime:currentTime
                  })
                })
                audioContext.onEnded(function(){
                  var duration=Math.round(audioContext.duration)
                  that.setData({currentTime:duration})
                })
                audioContext.onPlay(function(){
                  var currentTime=Math.round(audioContext.currentTime)
                  var duration=Math.round(audioContext.duration)
                  var percent=(currentTime/duration)*100
                  that.setData({
                    musicPercent:percent,
                    duration:duration,
                    currentTime:currentTime
                  })
                })
                audioContext.onPause(function(){
                  var currentTime=Math.round(audioContext.currentTime)
                  var duration=Math.round(audioContext.duration)
                  var percent=(currentTime/duration)*100
                  that.setData({
                    musicPercent:percent,
                    duration:duration,
                    currentTime:currentTime
                  })
                })
                that.setData({audioContext:audioContext})
                that.showModal()
              }
            }
          })
        }else{
          wx.setClipboardData({
            data: url,
            success: function(){
              wx.showModal({
                title: '提示' ,
                content: '由于微信限制，无法直接下载。链接已复制，请到手机浏览器粘贴下载。链接5分钟内有效。' ,
                success: function (res) {
                if (res.confirm) {
                }
                }
              })
            },
            fail: function(){
              wx.showToast({
                title: '链接复制失败',
                icon: 'loading',
                duration: 2000
              })
            }
          })
        }
      }*/
    }
  },

  pre: function(res){
    wx.showLoading({
      title: '正在加载目录',
    })
    var that=this;
    var nonSpliter=that.data.path.substring(0,that.data.path.lastIndexOf("/"))
    var pre_path=nonSpliter.substring(0,nonSpliter.lastIndexOf("/")+1)
    that.setData({path: pre_path})
    that.data.cos.getBucket({
        Bucket: 'highschool-1256959209', /* 必须 */
        Region: 'ap-guangzhou',    /* 必须 */
        Prefix: that.data.path,              /* 非必须 */
        Delimiter: '/',            /* 非必须 */
    }, function(err, data) {
        var dirs=data.CommonPrefixes
        var files=data.Contents
        var tmp_dirs=[]
        var tmp_files=[]
        for (var i = 0; i < dirs.length; i++) {
          var nonSliter=dirs[i].Prefix.substring(0,dirs[i].Prefix.lastIndexOf("/"))
          var folder=nonSliter.substring(nonSliter.lastIndexOf("/")+1,nonSliter.length)
          tmp_dirs.push({Prefix:folder})
        }
        for(var i=0; i < files.length; i++){
          if(files[i] != that.data.path){
            var file=files[i].Key.substring(files[i].Key.lastIndexOf("/")+1,files[i].Key.length)
            tmp_files.push({Key:file})
          }
        }
        var file=data.Contents
        that.setData({items: tmp_dirs})
        that.setData({files: tmp_files})
        that.setData({path: data.Prefix, result:[]})
    });
    wx.hideLoading()
  },

  containerTap: function (res) {
    var that = this
    var x = res.touches[0].pageX;
    var y = res.touches[0].pageY + 85;
    this.setData({hideRipple:false})
    this.setData({
      rippleStyle: ''
    });
    setTimeout(function () {
      that.setData({
        rippleStyle: 'top:' + y + 'px;left:' + x + 'px;-webkit-animation: ripple 0.4s linear;animation:ripple 0.4s linear;'
      });
      setTimeout(function(){
        that.setData({hideRipple:true})
      },200);
    }, 0)
  },

  moreaction: function(res){
    var that=this
    if(res.currentTarget.dataset.item!=this.data.path){
      that.setData({showActionsheet:true})
      var that=this
      var url = this.data.cos.getObjectUrl({
        Bucket: 'highschool-1256959209',
        Region: 'ap-guangzhou',
        Key: that.data.path+"/"+res.currentTarget.dataset.item
      });
      that.setData({url:url})
      that.setData({item:item})
      var item=that.data.path+"/"+res.currentTarget.dataset.item
      var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
    }
  },

  btnClick(e) {
    var that=this
    that.close()
    var id=e.detail.index
    var url=that.data.url
    if(id==0){
      //待增加功能
    }else if(id==1){
      //复制链接
      wx.setClipboardData({
        data: that.data.url,
        success: function(){
          wx.showToast({
            title: '链接已复制',
            icon: 'success',
            duration: 2000
          })
        },
      })
    }else if(id==2){
      //下载文件
      wx.showLoading({title: '下载中……'})
      wx.downloadFile({
        filePath: that.data.fileName,
        url: that.data.url,
        success (res) {
          wx.saveFileToDisk({
            filePath: that.data.fileName,
            success: function(){
              wx.showToast({
                title: '文件保存成功',
                icon: 'success',
                duration: 2000
              })
            },
            fail(){
              wx.showToast({
                title: '文件下载失败，文件下载功能仅限电脑端。',
                icon: 'loading',
                duration: 2000
              })
            },
            complete(){
              wx.hideLoading()
            }
          })
        },
        fail(res){
          wx.showToast({
            title: '文件下载失败',
            icon: 'loading',
            duration: 2000
          })
        }
      })
    }
  },
  close: function () {
      this.setData({
          showActionsheet: false
      })
  },
  showModal: function(){
    this.setData({showModal:true})
    var that=this
    var audioContext=that.data.audioContext
    audioContext.stop()
    that.setData({
      currentTime:0,
      musicPercent:0
    })
  },
  hideModal: function(){
    this.setData({showModal:false})
    var audioContext=this.data.audioContext
    audioContext.stop()
    audioContext.destroy()
  },
  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: function () {
  },
  playMusic: function(res){
    var that=this
    var audioContext=that.data.audioContext
    audioContext.play()
  },
  pauseMusic: function(){
    var that=this
    var audioContext=that.data.audioContext
    audioContext.pause()
  },
  setTouchMove: function(e){
    /*console.log(e)
    var that=this
    if(e.touches[0].clientY >= 390 && e.touches[0].clientY <= 410) {
      if (e.touches[0].clientX >= 55 && e.touches[0].clientX <= 355) {
        var percent = (e.touches[0].clientX - 55)/300*10000
        that.setData({
          musicPercent: Math.round(percent)/100 + ''
        })
        var audioContext=this.audioContext
      }
    }*/
  },
  resize: function(){
    var isHorizontal=null
    var that=this
    wx.getSystemInfoAsync({
      success: function(res){
        if(res.screenWidth>res.screenHeight){
          isHorizontal=true
          that.setData({showMore:true})
        }else{
          isHorizontal=false
          that.setData({showMore:false})
        }
      }
    })
  },

  search: function(res){
    wx.showLoading({
      title: '搜索中...',
    })
    var keyword=res.detail.value
    var that=this
    console.log("正在搜索关键词："+keyword)
    var path=that.data.path
    
    function searchHandler(err, data) {
      if (err) {
        return console.log('list error:', err);
      } else {
        var arr=data.Contents
        var file_list=[]
        for (let i = 0, len = arr.length; i < len; i++) {
          var item=arr[i]
          var file_key=item.Key
          var tmp_url = that.data.cos.getObjectUrl({
            Bucket: 'highschool-1256959209',
            Region: 'ap-guangzhou',
            Key: file_key
          });
          file_list[i]=tmp_url
        }
        /**
        * 对json数组进行搜索
        * @param {array} array [需要排序的数组]
        * @param {string} type [需要检索的字段]
        * @param {string} value [字段中应包含的值]
        * @return {array}    [包含指定信息的数组]
        */
        function search(array,type,value) {
          var arr2=[];
          var reg = new RegExp(value, 'i');
          arr2=array.filter(function(a) { 
            return a[type].toString().match(reg)!=null;
          });
          return arr2;
        };
        var result=search(arr,'Key',keyword);
        console.log("搜索完成")
        console.table(result)
        that.setData({files: [], items:[], result:result})
        wx.hideLoading({
          complete: (res) => {},
        })
      }
    }
    if(path==""){
      /*console.log("path为空判断分支")
      this.data.cos.getBucket({
        Bucket: 'highschool-1256959209', // 填入您自己的存储桶，必须字段 
        Region: 'ap-guangzhou',  // 存储桶所在地域，例如ap-beijing，必须字段 
        Delimiter: ''
      }, function(err, data){
        searchHandler(err,data)
      });*/
      wx.hideLoading({
        complete: (res) => {},
      })
      wx.showModal({
        title:"提示",
        content:"暂不支持在根目录搜索"
      })
    }else{
      this.data.cos.getBucket({
        Bucket: 'highschool-1256959209', /* 填入您自己的存储桶，必须字段 */
        Region: 'ap-guangzhou',  /* 存储桶所在地域，例如ap-beijing，必须字段 */
        Prefix: path,           /* Prefix表示列出的object的key以prefix开始，非必须 */
        Delimiter: ''
      }, function(err, data){
        searchHandler(err,data)
      });
    }
    
  },
  onAddToFavorites(res) {
    // webview 页面返回 webViewUrl
    let url = encodeURIComponent('/pages/cloud2/cloud?path=' + this.data.path)
    var path=this.data.path
    var fileName=path.substring(0,path.lastIndexOf("/"))
    var fileNameFinal=fileName.substring(fileName.lastIndexOf("/")+1,fileName.length)
    return {
      title: "学习资料："+fileNameFinal,
      imageUrl: '../../images/file.png',
      path: "/pages/cloud2/cloud?path="+this.data.path
    }
  },
  onShareTimeline(){
    let url = encodeURIComponent('/pages/cloud2/cloud?path=' + this.data.path)
    var path=this.data.path
    var fileName=path.substring(0,path.lastIndexOf("/"))
    var fileNameFinal=fileName.substring(fileName.lastIndexOf("/")+1,fileName.length)
    return {
      title: "学习资料："+fileNameFinal,
      imageUrl: '../../images/file.png',
      path: "/pages/cloud2/cloud?path="+this.data.path
    }
  }
})