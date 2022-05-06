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
    showDirActionsheet: false,
    groups: [
        { text: '复制链接', value: 1 },
        { text: '分享文件', value: 2 },
        { text: '下载文件', value: 3 },
        { text: '复制文件名', value: 4},
        { text: '复制路径', value: 5}
    ],
    dirgroups: [
      { text: '生成二维码', value: 1 },
      { text: '复制路径', value: 2 },
      { text: '分享目录', value: 3 }
    ],
    url:"",
    audioContext:{},
    showMore:true,
    showDownloadModal:false,
    img_list:[],
    color: "black",
    bucket: "highschool-1256959209",
    pc: false,
    mobile: true
  },
  getOptions() {
    // 获取当前小程序的页面栈  
    let pages = getCurrentPages();
 
    // 数组中索引最大的页面--当前页面
    let currentPage = pages[pages.length-1];
 
    // 定义 options
    let options = currentPage.options;
    //赋值
   this.setData({
      options: options,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    var options=this.getOptions()
    var that=this
    wx.getSystemInfo({
      success: (sys) => {
        console.log(sys)
        var platform=sys.platform
        if(platform == "windows" || platform=="mac" || platform=="pc"){
          var pc=true
          console.log("PC")
          that.setData({
              showMore:true,
              pc:true,
              mobile:false,
              groups: [
                { text: '复制链接', value: 1 },
                { text: '下载文件', value: 3 },
                { text: '复制文件名', value: 4},
                { text: '复制路径', value: 5}
                ]
            })
        }else{
          console.log("Not PC",platform)
          that.setData({
            groups: [
                { text: '复制链接', value: 1 },
                { text: '分享文件', value: 2 },
                { text: '复制文件名', value: 4},
                { text: '复制路径', value: 5}
            ]
          })
        }
      }
    })
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
    wx.getSystemInfo({
      success: function(res){
        if(res.theme=="dark"){
          that.setData({color: "white"})
        }
      }
    })
    wx.onThemeChange(function(res){
      var theme=res.theme
      if(theme=="dark"){
        that.setData({color: "white"})
      }else{
        that.setData({color: "black"})
      }
    })
    wx.showLoading({title: '正在初始化'})
    console.log("path",getApp().globalData.path)
    if(typeof(getApp().globalData.path)!="undefined"){
      this.setData({path: getApp().globalData.path})
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
    console.log("OnShow")
    this.setData({result:[]})
    wx.showLoading({title: '获取文件列表'})
    var that = this
    var pageIndex=5
    const db2 = wx.cloud.database()
    db2.collection('info').where({tag:"notify"}).get({
        success(res){
          var notify=res.data[0].content[pageIndex-1]
          if(notify==""){
            console.log("暂无公告")
          }else{
            wx.showModal({
              showCancel: false,
              title: "公告",
              content: notify
            })
          }
        }
    })
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
    var bucket=getApp().globalData.bucket
    if(typeof(bucket)=="undefined" || bucket==""){
      bucket="highschool-1256959209"
    }else{
      bucket=getApp().globalData.bucket
    }
    console.log("bucket:",bucket)
    that.setData({bucket: bucket})
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
          console.log("已有cos对象")
          that.setData({COS:getApp().globalData.COS})
          that.setData({cos:getApp().globalData.cos})
        }        
        getApp().globalData.cos.getBucket({
          Bucket: that.data.bucket,
          Region: 'ap-guangzhou',
          Prefix: that.data.path,
          Delimiter: "/",
        }, function(err, data) {
          if(err){
            console.error(err)
            wx.showModal({
              title: '文件库初始化失败',
              content: JSON.stringify(err)+"请截图联系开发者"
            })
          }
          var dirs=data.CommonPrefixes
          var files=data.Contents
          var tmp_dirs=[]
          var tmp_files=[]
          for (var i = 0; i < dirs.length; i++) {
            var nonSliter=dirs[i].Prefix.substring(0,dirs[i].Prefix.lastIndexOf("/"))
            //nonSliter=dirs[i].Prefix
            console.log(nonSliter)
            var folder=nonSliter.substring(nonSliter.lastIndexOf("/")+1,nonSliter.length)
            tmp_dirs.push({Prefix:folder})
          }
          for(var i=0; i < files.length; i++){
            if(files[i] != that.data.path){
              var file=files[i].Key.substring(files[i].Key.lastIndexOf("/")+1,files[i].Key.length)
              var vSize=""
              var bsize=files[i].Size
              if(bsize>1024*1024*1024){
                vSize=(bsize/1024/1024/1024).toFixed(2)+"GB"
              }else if(bsize>1024*1024){
                vSize=(bsize/1024/1024).toFixed(2)+"MB"
              }else if(bsize>1024){
                vSize=(bsize/1024).toFixed(2)+"KB"
              }else{
                vSize=bsize+"字节"
              }
              tmp_files.push({
                Key:file,
                time:files[i].LastModified.substring(0,10),
                size:files[i].Size,
                md5:files[i].ETag,
                vSize: vSize
              })
            }
          }
          that.setData({items: tmp_dirs})
          that.setData({files: tmp_files})
        });
        wx.hideLoading()
      }
    })
    wx.hideLoading()
    wx.stopPullDownRefresh()
  },
  onPullDownRefresh: function() {
    this.onShow({})
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
    var that=this
    var nonSpliter=that.data.path.substring(0,that.data.path.lastIndexOf("/"))
    var pre_path=nonSpliter.substring(0,nonSpliter.lastIndexOf("/")+1)
    var navigateUrl='/pages/cloud2/cloud?path='+pre_path
    that.setData({path: pre_path})
    if(pre_path==""||pre_path=="/"){
      wx.switchTab({
        url: '../cloud/cloud',
      })
      return
    }
    getApp().globalData.path=pre_path
    console.log(navigateUrl)
    wx.navigateTo({
      url: navigateUrl,
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.onShow()
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
    let url = encodeURIComponent('/pages/cloud2/cloud?path=' + this.data.path)
    var path=this.data.path
    var fileName=path.substring(0,path.lastIndexOf("/"))
    var fileNameFinal=fileName.substring(fileName.lastIndexOf("/")+1,fileName.length)
    return {
      title: "学习资料："+fileNameFinal,
      path: "/pages/cloud2/cloud?path="+this.data.path
    }
  },

  selected: function(res){
    wx.showLoading({
      title: '正在加载目录',
    })
    var that = this
    if(typeof(that.data.path)=="undefined"){
      that.setData({path:""})
    }
    that.setData({path:that.data.path+res.currentTarget.dataset.item+"/"})
    this.data.cos.getBucket({
      Bucket: that.data.bucket, /* 必须 */
      Region: 'ap-guangzhou',    /* 必须 */
      Prefix: that.data.path,              /* 非必须 */
      Delimiter: '/',            /* 非必须 */
   }, function(err, data) {
      if(err){
        console.error(err)
        wx.showModal({
          title: '文件库初始化失败',
          content: JSON.stringify(err)+"请截图联系开发者"
        })
      }
      var dirs=data.CommonPrefixes //目录下所有子目录
      var files=data.Contents //目录下所有文件
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
          var vSize=""
          var bsize=files[i].Size
          if(bsize>1024*1024*1024){
            vSize=(bsize/1024/1024/1024).toFixed(2)+"GB"
          }else if(bsize>1024*1024){
            vSize=(bsize/1024/1024).toFixed(2)+"MB"
          }else if(bsize>1024){
            vSize=(bsize/1024).toFixed(2)+"KB"
          }else{
            vSize=bsize+"字节"
          }
          tmp_files.push({
            Key:file,
            time:files[i].LastModified.substring(0,10),
            size:files[i].Size,
            md5:files[i].ETag,
            vSize: vSize
          })
        }
      }
      /*      
      for(dir in dirs){
        var nonSliter=dirs[dir].Prefix.substring(0,dirs[dir].length)
        var folder=nonSliter.substring(nonSliter.lastIndexOf("/"),nonSliter.length)
        tmp_dirs.push(folder)
      }*/
      var file=data.Contents
      that.setData({items: tmp_dirs})
      that.setData({files: tmp_files})
      that.setData({path: data.Prefix})
      getApp().globalData.path=data.Prefix
      console.info("文件列表",tmp_files);
   });
    wx.hideLoading()
  },

  download: function(res){
    if(res.currentTarget.dataset.item!=this.data.path){
      wx.showLoading({title: '初始化下载信息'})
      var that=this
      var url = this.data.cos.getObjectUrl({
        Bucket: that.data.bucket,
        Region: 'ap-guangzhou',
        Key: that.data.path+"/"+res.currentTarget.dataset.item
      });
      var item=that.data.path+"/"+res.currentTarget.dataset.item
      var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
      console.log(res)
      //判断文档、图片、视频并执行预览
      var docEnding=[".docx",".doc",".xls",".xlsx",".pdf",".ppt",".pptx"]
      var imgEnding=[".jpg",".png",".jpeg",".gif"]
      var videoEnding=[".mp3",".wav",".flac"]
      var cosSupport=["pot","potx","pps","ppsx","dps","dpt","pptm","potm","ppsm","dot","wps","wpt","dotx","docm","dotm","xlt","et","ett","xltx","csv","xlsb","xlsm","xltm","ets","lrc","c","cpp","h","asm","s","java","asp","bat","bas","prg","cmd","rtf","txt","log","xml","htm","html"]
      var isDoc=false
      var isImg=false
      var isVideo=false
      var cosSupportB=false
      var pause=true
      var img_list=[]
      var ending=fileName.substring(fileName.lastIndexOf("."),fileName.length)
      for(item in docEnding){
        if(ending==docEnding[item]){
          isDoc=true
        }else if(ending==imgEnding[item]){
          isImg=true
          /*this.data.cos.getBucket({
            Bucket: that.data.bucket, // 填入您自己的存储桶，必须字段 
            Region: 'ap-guangzhou',  // 存储桶所在地域，例如ap-beijing，必须字段 
            Prefix: that.data.path,           // Prefix表示列出的object的key以prefix开始，非必须 
            Delimiter: '/'
          }, function(err, data) {
            if (err) {
              console.error(err)
              wx.showModal({
                title: '获取文件列表失败',
                content: JSON.stringify(err)+"请截图联系开发者"
              })
              return console.log('list error:', err);
            } else {
                var arr=data.Contents
                for (let i = 0, len = arr.length; i < len; i++) {
                  var item=arr[i]
                  var img_key=item.Key
                  var tmp_url = that.data.cos.getObjectUrl({
                    Bucket: that.data.bucket,
                    Region: 'ap-guangzhou',
                    Key: img_key
                  });
                  img_list[i]=tmp_url
                }
                that.setData({img_list: img_list})
                pause=false
            }
          });*/
        }else if(ending==videoEnding[item]){
          isVideo=true
        }else{

        }
      }
      for(var endFix in cosSupport){
        if(ending=="."+cosSupport[endFix]){
          cosSupportB=true
        }
      }
      item=that.data.path+""+res.currentTarget.dataset.item
      var fileobjList=that.data.files
      var fileinfo={}
      for(var index in fileobjList){
        if(fileobjList[index].Key==res.currentTarget.dataset.item){
          fileinfo=fileobjList[index]
        }
      }
      if(fileinfo.size > 100*1024*1024){
        //大于10MB的文件微信不能直接预览
        console.warn("文件大于20MB")
        isDoc=false
        if(ending==".ppt",".pptx",".xls",".xlsx"){
          cosSupportB=true
          console.log("cos support max file")
        }else{
          
        }
      }
      console.log(fileinfo)
      var platform=""
      var pc=false
      wx.getSystemInfo({
        success: (sys) => {
          platform=sys.platform
          getApp().globalData.path=that.data.path
          console.log("Set path global",getApp())
          if(platform == "windows" || platform=="mac" || platform=="pc"){
            pc=true
          }
          if(pc){
            console.log(pc)
            if(ending==".doc" || ending==".docx" || ending==".pdf"){
              console.log("直接支持PC端预览")
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
                          console.error(res)
                          wx.showModal({
                            title: '文件打开失败',
                            content: JSON.stringify(res)+"请截图联系开发者"
                          })
                        }
                    })
                },
                fail(res){
                  console.error(res)
                  wx.showModal({
                    title: '文件下载失败',
                    content: JSON.stringify(res)+"请截图联系开发者"
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
                that.data.cos.getBucket({
                Bucket: that.data.bucket, // 填入您自己的存储桶，必须字段 
                Region: 'ap-guangzhou',  // 存储桶所在地域，例如ap-beijing，必须字段 
                Prefix: that.data.path,           // Prefix表示列出的object的key以prefix开始，非必须 
                Delimiter: '/'
                }, function(err, data) {
                if (err) {
                    console.error(err)
                    wx.showModal({
                    title: '获取文件列表失败',
                    content: JSON.stringify(err)+"请截图联系开发者"
                    })
                    return console.log('list error:', err);
                } else {
                    var arr=data.Contents
                    for (let i = 0, len = arr.length; i < len; i++) {
                        var item=arr[i]
                        var img_key=item.Key
                        var tmp_url = that.data.cos.getObjectUrl({
                        Bucket: that.data.bucket,
                        Region: 'ap-guangzhou',
                        Key: img_key
                        });
                        if(item.Key!=that.data.path){
                        img_list.push(tmp_url)
                        console.log(item)
                        }
                        if(i==arr.length-1){
                        //接下来的操作
                        wx.hideLoading()
                        var imgUrls=img_list.valueOf()
                        wx.previewImage({
                            current: url,
                            urls: imgUrls
                        })
                        }
                    }
                }
                });
            }else if(ending==".ppt",".pptx",".xls",".xlsx"){
              that.cosPreview(item) //调用COS的预览接口支持预览
            }else if(cosSupportB){
              console.log("cos次级支持")
              //that.cosPreview(item)
            }else{
              wx.showModal({
                title:"提示",
                content:"暂不支持预览该类型文件，请尝试用手机打开。",
                showCancel:false
              })
              wx.hideLoading()
              return
            }
          }else{
            wx.hideLoading()
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
                          console.error(res)
                          wx.showModal({
                            title: '文件打开失败',
                            content: JSON.stringify(res)+"请截图联系开发者"
                          })
                        }
                    })
                },
                fail(res){
                  console.error(res)
                  wx.showModal({
                    title: '文件下载失败',
                    content: JSON.stringify(res)+"请截图联系开发者"
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
              that.data.cos.getBucket({
                Bucket: that.data.bucket, // 填入您自己的存储桶，必须字段 
                Region: 'ap-guangzhou',  // 存储桶所在地域，例如ap-beijing，必须字段 
                Prefix: that.data.path,           // Prefix表示列出的object的key以prefix开始，非必须 
                Delimiter: '/'
              }, function(err, data) {
                if (err) {
                  console.error(err)
                  wx.showModal({
                    title: '获取文件列表失败',
                    content: JSON.stringify(err)+"请截图联系开发者"
                  })
                  return console.log('list error:', err);
                } else {
                    var arr=data.Contents
                    for (let i = 0, len = arr.length; i < len; i++) {
                      var item=arr[i]
                      var img_key=item.Key
                      var tmp_url = that.data.cos.getObjectUrl({
                        Bucket: that.data.bucket,
                        Region: 'ap-guangzhou',
                        Key: img_key
                      });
                      if(item.Key!=that.data.path){
                        img_list.push(tmp_url)
                        console.log(item)
                      }
                      if(i==arr.length-1){
                        //接下来的操作
                        wx.hideLoading()
                        var imgUrls=img_list.valueOf()
                        wx.previewImage({
                          current: url,
                          urls: imgUrls
                        })
                      }
                    }
                }
              });
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
            }else if(cosSupportB){
              console.log("COS预览支持")
              that.cosPreview(item) //调用COS的预览接口支持预览
            }else{
              console.log(cosSupportB)
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
                  console.error(res)
                  wx.showModal({
                    title: '链接复制失败',
                    content: JSON.stringify(res)+"请截图联系开发者"
                  })
                }
              })
            }
          }
        },
        fail(res){
          console.error(res)
          wx.showModal({
            title: '获取系统信息失败',
            content: JSON.stringify(res)+"请截图联系开发者"
          })
        }
      });
    }
  },
  search_download: function(res){
    var result=res
    console.log("sdownres",res)
    var fullpath=res.currentTarget.dataset.item
    var fileName=fullpath.substring(fullpath.lastIndexOf("/")+1,fullpath.length)
    result.currentTarget.dataset.item=fileName
    result.currentTarget.dataset.id=fileName
    console.log("sdown",result)
    wx.showModal({
      title:"预览失败",
      content:"开发者正在努力开发中，敬请期待！"
    })
    return
    this.download(result)
  },
  cosPreview:function(itemKey) {
    var that=this
    wx.showLoading({
      title: '格式转换中',
    })
    console.log("格式转换中")
    that.data.cos.getObjectUrl({
      Bucket: that.data.bucket,
      Region: 'ap-guangzhou',
      Key: itemKey,
      Sign: true,
      Expires: 3600, // 签名有效期单位秒
    }, function (err, data) {
      if(err){
        console.error(err)
        wx.hideLoading()
      }else{
        //无出错，继续运行
        var signedUrl=data.Url
        var item=itemKey
        var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
        var finalUrl=signedUrl+"&ci-process=doc-preview&dsttype=pdf&comment=1&excelPaperDirection=1"
        console.log(finalUrl)
        const basepath = `${wx.env.USER_DATA_PATH}/`
        var downloadTask=wx.downloadFile({
          filePath: basepath+fileName,
          url: finalUrl,
          success (res) {
              wx.openDocument({
                  filePath: basepath+fileName,
                  fileType: "pdf",
                  showMenu: true,
                  success(){
                  },
                  complete: function(){
                    wx.hideLoading()
                  },
                  fail(res){
                    console.error(res)
                    wx.showModal({
                      title: '文件打开失败',
                      content: JSON.stringify(res)+"请截图联系开发者"
                    })
                  }
              })
          },
          fail(res){
            console.error(res)
            wx.showModal({
              title: '文件下载失败',
              content: JSON.stringify(res)+"请截图联系开发者"
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
          if(!that.data.showDownloadModal){
            that.setData({
              showDownloadModal:true
            })
          }
          wx.hideLoading()
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
      }
    });
  },
  search_download2: function(res){
    getApp().globalData.path=this.data.path
    if(res.currentTarget.dataset.item!=this.data.path){
      console.log("进入搜索后下载回调2",res)
      wx.showLoading({title: '初始化下载信息'})
      var that=this
      var url=this.data.cos.getObjectUrl({
        Bucket: that.data.bucket,
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
      var cosSupport=["pot","potx","pps","ppsx","dps","dpt","pptm","potm","ppsm","dot","wps","wpt","dotx","docm","dotm","xlt","et","ett","xltx","csv","xlsb","xlsm","xltm","ets","lrc","c","cpp","h","asm","s","java","asp","bat","bas","prg","cmd","rtf","txt","log","xml","htm","html"]
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
      for(var endFix in cosSupport){
        if(ending=="."+cosSupport[endFix]){
          cosSupportB=true
        }
      }
      item=that.data.path+""+res.currentTarget.dataset.item
      var fileobjList=that.data.files
      var fileinfo={}
      for(var index in fileobjList){
        if(fileobjList[index].Key==res.currentTarget.dataset.item){
          fileinfo=fileobjList[index]
        }
      }
      if(fileinfo.size > 10*1024*1024){
        //大于10MB的文件微信不能直接预览
        console.warn("文件大于10MB")
        isDoc=false
        cosSupportB=true
      }
      console.log(fileinfo)

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
                    console.error(res)
                    wx.showModal({
                      title: '错误',
                      content: "文件打开失败。"
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
      }else if(cosSupportB){
        console.log("COS预览支持")
        that.cosPreview(item) //调用COS的预览接口支持预览
      }else{
        wx.setClipboardData({
          data: url,
          success: function(){
            wx.showModal({
              title: '提示' ,
              content: '由于微信限制，无法直接下载。链接已复制，请到手机浏览器粘贴下载。链接5分钟内有效。' 
            })
          },
          fail: function(){
            console.error(res)
            wx.showModal({
              title: '链接复制失败',
              content: JSON.stringify(res)+"请截图联系开发者"
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
    if(that.data.path==undefined || that.data.path==""){
      wx.switchTab({
        url:"../cloud/cloud"
      })
      return
    }
    var nonSpliter=that.data.path.substring(0,that.data.path.lastIndexOf("/"))
    var pre_path=nonSpliter.substring(0,nonSpliter.lastIndexOf("/")+1)
    that.setData({path: pre_path})
    that.data.cos.getBucket({
        Bucket: that.data.bucket, /* 必须 */
        Region: 'ap-guangzhou',    /* 必须 */
        Prefix: that.data.path,              /* 非必须 */
        Delimiter: '/',            /* 非必须 */
    }, function(err, data) {
        if(err){
          console.error(err)
          wx.showModal({
            title: '上级列表失败',
            content: JSON.stringify(err)+"请截图联系开发者"
          })
        }
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
            var vSize=""
            var bsize=files[i].Size
            if(bsize>1024*1024*1024){
              vSize=(bsize/1024/1024/1024).toFixed(2)+"GB"
            }else if(bsize>1024*1024){
              vSize=(bsize/1024/1024).toFixed(2)+"MB"
            }else if(bsize>1024){
              vSize=(bsize/1024).toFixed(2)+"KB"
            }else{
              vSize=bsize+"字节"
            }
            tmp_files.push({
              Key:file,
              time:files[i].LastModified.substring(0,10),
              size:files[i].Size,
              md5:files[i].ETag,
              vSize: vSize
            })
          }
        }
        var file=data.Contents
        that.setData({items: tmp_dirs})
        that.setData({files: tmp_files})
        that.setData({path: data.Prefix, result:[]})
        console.log(data.Prefix)
        if(that.data.bucket=="costudy-1256959209"){
          return
        }
        if(data.Prefix=="/" || data.Prefix=="" || data==undefined){
          wx.switchTab({
            url:"../cloud/cloud"
          })
          return
        }
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
        Bucket: that.data.bucket,
        Region: 'ap-guangzhou',
        Key: that.data.path+"/"+res.currentTarget.dataset.item
      });
      var item=that.data.path+""+res.currentTarget.dataset.item
      var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
      //getApp().globalData.path=that.data.path
      that.setData({url:url,item:item,cpFileName:fileName,path:that.data.path})
    }
  },
  short_down: function(res){
    var that=this
    var platform=""
    getApp().globalData.path=that.data.path
    console.log("Set path global",getApp())
    var pc=false
    wx.getSystemInfo({
      success: (sys) => {
        platform=sys.platform
        if(platform == "windows" || platform=="mac" || platform=="pc"){
          pc=true
        }
        if(pc){
          console.log(res)
          if(res.currentTarget.dataset.item!=this.data.path){
            var that=this
            var url = this.data.cos.getObjectUrl({
              Bucket: that.data.bucket,
              Region: 'ap-guangzhou',
              Key: that.data.path+"/"+res.currentTarget.dataset.item
            });
            var item=that.data.path+""+res.currentTarget.dataset.item
            var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
            getApp().globalData.path=that.data.path
            that.setData({url:url,item:item,cpFileName:fileName})
            //下载文件

            console.log("下载文件",that.data.cpFileName)
            var filePath=`${wx.env.USER_DATA_PATH}/`+that.data.cpFileName
            that.setData({showDownloadModal:true})
            var downloadTask=wx.downloadFile({
              filePath: filePath,
              url: that.data.url,
              success (res) {
                wx.saveFileToDisk({
                  filePath: filePath,
                  success: function(){
                    wx.showToast({
                      title: '文件保存成功',
                      icon: 'success',
                      duration: 2000
                    })
                  },
                  fail(res){
                    wx.hideLoading()
                    console.error(res)
                    if(res.errMsg=="saveFileToDisk:fail user cancel"){
                      wx.showModal({
                        title: '文件保存失败',
                        content: "您取消了文件保存。",
                        showCancel: false
                      })
                    }else{
                      wx.showModal({
                        title: '文件保存失败',
                        content: JSON.stringify(res)+"请截图联系开发者",
                        showCancel: false
                      })
                    }
                  },
                  complete(){
                    that.setData({showDownloadModal:false})
                  }
                })
              },
              fail(res){
                wx.hideLoading()
                console.error(res)
                wx.showModal({
                  title: '文件下载失败',
                  content: JSON.stringify(res)+"请截图联系开发者"
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
          }
        }else{
          wx.showModal({
            title: "无法下载",
            content: "受微信限制，无法将文件保存到手机，请用电脑使用该功能。",
            showCancel: false
          })
        }
      }
    })
  },
  short_share: function(res){
    var that=this
    console.log(res)
    if(res.currentTarget.dataset.item!=this.data.path){
      var that=this
      var url = this.data.cos.getObjectUrl({
        Bucket: that.data.bucket,
        Region: 'ap-guangzhou',
        Key: that.data.path+"/"+res.currentTarget.dataset.item
      });
      var item=that.data.path+""+res.currentTarget.dataset.item
      var fileName=item.substring(item.lastIndexOf("/")+1,item.length)
      getApp().globalData.path=that.data.path
      that.setData({url:url,item:item,cpFileName:fileName})
      var platform=""
      getApp().globalData.path=that.data.path
      console.log("Set path global",getApp())
      var pc=false
      wx.getSystemInfo({
        success: (sys) => {
          platform=sys.platform
          if(platform == "windows" || platform=="mac" || platform=="pc"){
            pc=true
          }
          if(pc){
            wx.showModal({
              title: "无法分享",
              content: "受微信限制，无法将文件保存到手机，请用电脑使用该功能。",
              showCancel: false
            })
          }else{
            //分享文件
            console.log("分享文件",that.data.cpFileName)
            var filePath=`${wx.env.USER_DATA_PATH}/`+that.data.cpFileName
            that.setData({showDownloadModal:true})
            var downloadTask=wx.downloadFile({
              filePath: filePath,
              url: that.data.url,
              success (res) {
                wx.shareFileMessage({
                  filePath: filePath,
                  fileName: that.data.cpFileName,
                  fail: function (res) {
                    console.error(res)
                    wx.showModal({
                      title: '文件分享失败',
                      content: JSON.stringify(res)+"请截图联系开发者"
                    })
                  },
                  success: function(res) {
                    wx.showToast({
                      title: '分享成功',
                    })
                  }
                })
              },
              fail(res){
                wx.hideLoading()
                console.error(res)
                wx.showModal({
                  title: '文件下载失败',
                  content: JSON.stringify(res)+"请截图联系开发者"
                })
              },
              complete(){
                that.setData({showDownloadModal:false})
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
          }
        }
      })
    }
  },
  dirmoreaction: function(res){
    var that=this
    if(res.currentTarget.dataset.item!=this.data.path){
      that.setData({showDirActionsheet:true})
      var that=this
      console.log(res)
      var name=res.currentTarget.dataset.item
      var path=that.data.path+name+"/"
      that.setData({
        sharePath: path,
        shareName: name
      })
    }
  },
  defaultName:function () {
    var length=12
    const data =
      ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F",
        "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y",
        "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z"];
    let nums = "";
    for (let i = 0; i < length; i++) {
      const r = parseInt(Math.random() * 61, 10);
      nums += data[r];
    }
    return nums;
  },
  dirAction: function(res) {
    var that=this
    console.log(res)
    that.setData({showDirActionsheet:false})
    if(res.detail.index==0){
      //生成二维码
      wx.showLoading({
        title: '生成中',
      })
      wx.cloud.callFunction({
        // 云函数名称
        name: 'getCode',
        // 传给云函数的参数
        data: {
          path: that.data.sharePath
        },
      }).then(res => {
        var fs=wx.getFileSystemManager()
        console.log(res)
        var tmpPath=`${wx.env.USER_DATA_PATH}/`+that.defaultName()+".png"
        var imgSrc =  wx.arrayBufferToBase64(res.result.buffer.data);//二进制流转为base64编码
        var save = wx.getFileSystemManager();
        var number = Math.random();
        save.writeFile({
            filePath: tmpPath,
            data: imgSrc,
            encoding: 'base64',
            success: res => {
              /*wx.showShareImageMenu({
                path: tmpPath
              })*/    
              wx.saveImageToPhotosAlbum({ //保存为png格式到相册
                  filePath: tmpPath,
                  success: function (res) {
                      wx.showToast({
                          title: '保存成功',
                          icon: 'none',
                          duration: 2000, //提示的延迟时间，单位毫秒，默认：1500
                      })
                  },
                  fail: function (err) {
                      console.log(err)
                  }
              })
            }, 
            fail: err => {
                console.log(err)
            }
        })
      })
      .catch(console.error)
    }else if(res.detail.index==1){
      //复制路径
      wx.setClipboardData({
        data: that.data.sharePath,
        success: function(){
          wx.showToast({
            title: '路径已复制',
            icon: 'success',
            duration: 2000
          })
        },
      })
    }else if(res.detail.index==1){
      //分享目录
      wx.setClipboardData({
        data: that.data.shareName,
        success: function(){
          wx.showToast({
            title: '目录名已复制',
            icon: 'success',
            duration: 2000
          })
        },
      })
    }
  },
  btnClick(e) {
    var that=this
    that.close()
    var id=e.detail.value-1
    var url=that.data.url
    if(id==0){
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
    }else if(id==1){
      var platform=""
      getApp().globalData.path=that.data.path
      console.log("Set path global",getApp())
      var pc=false
      wx.getSystemInfo({
        success: (sys) => {
          platform=sys.platform
          if(platform == "windows" || platform=="mac" || platform=="pc"){
            pc=true
          }
          if(pc){
            wx.showModal({
              title: "无法分享",
              content: "受微信限制，无法将文件保存到手机，请用电脑使用该功能。",
              showCancel: false
            })
          }else{
            //分享文件
            console.log("分享文件",that.data.cpFileName)
            var filePath=`${wx.env.USER_DATA_PATH}/`+that.data.cpFileName
            that.setData({showDownloadModal:true})
            var downloadTask=wx.downloadFile({
              filePath: filePath,
              url: that.data.url,
              success (res) {
                wx.shareFileMessage({
                  filePath: filePath,
                  fileName: that.data.cpFileName,
                  fail: function (res) {
                    console.error(res)
                    wx.showModal({
                      title: '文件分享失败',
                      content: JSON.stringify(res)+"请截图联系开发者"
                    })
                  },
                  success: function(res) {
                    wx.showToast({
                      title: '分享成功',
                    })
                  }
                })
              },
              fail(res){
                wx.hideLoading()
                console.error(res)
                wx.showModal({
                  title: '文件下载失败',
                  content: JSON.stringify(res)+"请截图联系开发者"
                })
              },
              complete(){
                that.setData({showDownloadModal:false})
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
          }
        }
      })
    }else if(id==2){
      //下载文件
      var platform=""
      getApp().globalData.path=that.data.path
      console.log("Set path global",getApp())
      var pc=false
      wx.getSystemInfo({
        success: (sys) => {
          platform=sys.platform
          if(platform == "windows" || platform=="mac" || platform=="pc"){
            pc=true
          }
          if(pc){
            //下载文件
            var filePath=`${wx.env.USER_DATA_PATH}/`+that.data.cpFileName
            console.log("下载文件",filePath)
            that.setData({showDownloadModal:true})
            var downloadTask=wx.downloadFile({
              filePath: filePath,
              url: that.data.url,
              success (res) {
                wx.saveFileToDisk({
                  filePath: filePath,
                  success: function(){
                    wx.showToast({
                      title: '文件保存成功',
                      icon: 'success',
                      duration: 2000
                    })
                  },
                  fail(res){
                    wx.hideLoading()
                    console.error(res)
                    if(res.errMsg=="saveFileToDisk:fail user cancel"){
                      wx.showModal({
                        title: '文件保存失败',
                        content: "您取消了文件保存。",
                        showCancel: false
                      })
                    }else{
                      wx.showModal({
                        title: '文件保存失败',
                        content: JSON.stringify(res)+"请截图联系开发者",
                        showCancel: false
                      })
                    }
                  },
                  complete(){
                    that.setData({showDownloadModal:false})
                  }
                })
              },
              fail(res){
                wx.hideLoading()
                console.error(res)
                wx.showModal({
                  title: '文件下载失败',
                  content: JSON.stringify(res)+"请截图联系开发者"
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
          }else{
            wx.showModal({
              title: "无法下载",
              content: "受微信限制，无法将文件保存到手机，请用电脑使用该功能。",
              showCancel: false
            })
          }
        }
      })
    }else if(id==3){
      //复制文件名
      console.log(that.data.cpFileName)
      wx.setClipboardData({
        data: that.data.cpFileName,
        success: function(){
          wx.showToast({
            title: '文件名已复制',
            icon: 'success',
            duration: 2000
          })
        },
      })
    }else if(id==4){
      //复制文件路径
      console.log(that.data.item)
      wx.setClipboardData({
        data: that.data.item,
        success: function(){
          wx.showToast({
            title: '文件路径已复制',
            icon: 'success',
            duration: 2000
          })
        },
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
        console.error(err)
        wx.showModal({
          title: '搜索列表失败',
          content: JSON.stringify(err)+"请截图联系开发者"
        })
        return console.log('list error:', err);
      } else {
        var arr=data.Contents
        var file_list=[]
        for (let i = 0, len = arr.length; i < len; i++) {
          var item=arr[i]
          var file_key=item.Key
          var tmp_url = that.data.cos.getObjectUrl({
            Bucket: that.data.bucket,
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
        that.setData({files: [], items:[], result:result})
        wx.hideLoading({
          complete: (res) => {},
        })
      }
    }
    if(path==""){
      /*console.log("path为空判断分支")
      this.data.cos.getBucket({
        Bucket: that.data.bucket, // 填入您自己的存储桶，必须字段 
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
        Bucket: that.data.bucket, /* 填入您自己的存储桶，必须字段 */
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
  },
  stringToArrayBuffer:function(str) {
    var bytes = new Array(); 
    var len,c;
    len = str.length;
    for(var i = 0; i < len; i++){
      c = str.charCodeAt(i);
      if(c >= 0x010000 && c <= 0x10FFFF){
        bytes.push(((c >> 18) & 0x07) | 0xF0);
        bytes.push(((c >> 12) & 0x3F) | 0x80);
        bytes.push(((c >> 6) & 0x3F) | 0x80);
        bytes.push((c & 0x3F) | 0x80);
      }else if(c >= 0x000800 && c <= 0x00FFFF){
        bytes.push(((c >> 12) & 0x0F) | 0xE0);
        bytes.push(((c >> 6) & 0x3F) | 0x80);
        bytes.push((c & 0x3F) | 0x80);
      }else if(c >= 0x000080 && c <= 0x0007FF){
        bytes.push(((c >> 6) & 0x1F) | 0xC0);
        bytes.push((c & 0x3F) | 0x80);
      }else{
        bytes.push(c & 0xFF);
      }
    }
    var array = new Int8Array(bytes.length);
    for(var i in bytes){
      array[i] =bytes[i];
    }
    return array.buffer;
  }
})