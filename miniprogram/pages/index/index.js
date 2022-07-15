var wxCharts = require('./wxcharts.js');
import uCharts from '../../components/ucharts/ucharts'
import * as echarts from '../../ec-canvas/echarts';
var app = getApp();
var lineChart=null
var lineChartThree=null
var lineChartTotal=null//
var slineChart=null//小测成绩折现图空对象
var radarChart=null
let chart = null;
var _self;
var canvaColumn = null;

function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // 像素
  });
  canvas.setChart(chart);

  var option = {
    title: {
        text: 'ECharts 入门示例'
    },
    tooltip: {},
    legend: {
        data:['销量']
    },
    xAxis: {
        data: ["衬衫","羊毛衫","雪纺衫","裤子","高跟鞋","袜子"]
    },
    yAxis: {},
    series: [{
        name: '销量',
        type: 'bar',
        data: [5, 20, 36, 10, 10, 20]
    }]
  };
  chart.setOption(option);
  return chart;
}

Page({
  data: {
    hidden_login: true,
    count: 0,
    data: [],
    hiddenmodalput:true,
    sarray:["语文","数学","英语","物理","地理","生物","政治","历史","化学"],
    sindex2: 0,
    canvasWidth: 375,
    showTestModal: true,
    ec: {
      onInit: initChart
    }
  },
  onPullDownRefresh:function(params) {
    this.onLoad({})
  },
  getServerData: function () {
    wx.request({
      url: 'https://www.ucharts.cn/data.json',
      data: {
      },
      success: function (res) {
        let Column = { categories: [], series: [] };
        Column.categories = res.data.data.ColumnB.categories;
        Column.series = res.data.data.ColumnB.series;
        //自定义标签颜色和字体大小
        Column.series[1].textColor = 'red';
        Column.series[1].textSize = 11;
        _self.showColumn("canvasColumn", Column);
      },
      fail: () => {
        console.log("请点击右上角【详情】，启用不校验合法域名");
      },
    })
  },
  touchColumn: function(res) {
    console.log(res)
  },
  showColumn(canvasId, chartData) {
    var context=wx.createCanvasContext("canvas1")
    canvaColumn = new uCharts({
      $this: _self,
      context: context,
      canvasId: canvasId,
      type: 'line',
      legend: true,
      fontSize: 11,
      background: '#FFFFFF',
      pixelRatio: 1,
      animation: true,
      categories: chartData.categories,
      series: chartData.series,
      xAxis: {
        disableGrid: true,
      },
      yAxis: {  
        //disabled:true
      },
      dataLabel: true,
      width: _self.cWidth ,
      height: _self.cHeight ,
      extra: {
        column: {
          type: 'group',
          width: _self.cWidth * 0.45 / chartData.categories.length
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function (options) {
    var that = this;
    const db = wx.cloud.database();
    _self=this;
    var updater=wx.getUpdateManager()
    updater.onCheckForUpdate(function(res){
      if(res.hasUpdate){
        console.log("Update available")
        updater.applyUpdate()
      }
    })
    this.cWidth = wx.getSystemInfoSync().windowWidth;
    this.cHeight = 500 / 750 * wx.getSystemInfoSync().windowWidth;
    this.getServerData()
    var gaokao
    db.collection('countDown').get({
      success: function(res) {
        if(res.data.length==0){
          //空数据
          gaokao=new Date("2023-06-07");
        }else{
          //有数据
          console.log(res.data[0].year)
          gaokao=new Date(res.data[0].year+"-06-07");
          console.log("设置了高考日期")
          var now=new Date().getTime();
          var countDown=gaokao-now;
          var day=Math.floor(countDown/(1000*60*60*24));
          that.setData({count: day})
        }
        console.log(res)        
      }
    })
    var width=320
    wx.createSelectorQuery().selectAll('.container').boundingClientRect(function (rect) {
      console.log("width：",rect[0].width)
      width=rect[0].width
      that.setData({canvasStyle: "width:"+width,canvasWidth:width});
    }).exec()
    const _ = db.command;
    const list=[];
    db.collection('score').get({
      success: function(res) {
        const length=res.data.length;
        var score=res.data[length-1].total;
        that.setData({
          score: score
        });
      }
    });
    var tmpSeriesList=[];
  var tmpXList=[];
  var tmpSeriesList=[];
  var detailSeries={chinese:[],math:[],english:[],physics:[],history:[],geography:[],chemistry:[],biology:[],politics:[]}
  var tmpXList=[];
  db.collection('score').get({
    success: function(res) {
      const list=res.data;
      if(list.length > 0){
        function parse(string){
          if(string==""){
            return null
          }else{
            return(parseInt(string))
          }
        }
        var recentList=list[list.length-1]
        console.log(recentList)
        for(var i = 0; i < list.length; i++){
          var j=list[i];
          tmpSeriesList.push(parseInt(j.total));
          detailSeries.chinese.push(parseInt(j.chinese));
          detailSeries.english.push(parseInt(j.english));
          detailSeries.math.push(parseInt(j.math));
          detailSeries.physics.push(parse(j.physics));
          detailSeries.history.push(parse(j.history));
          detailSeries.geography.push(parse(j.geography));
          detailSeries.politics.push(parse(j.politics));
          detailSeries.biology.push(parse(j.biology));
          detailSeries.chemistry.push(parse(j.chemistry));
          tmpXList.push(j.name);
        }
        /*开始建造wx-charts所需数据格式（总成绩）*/
        var windowWidth = 320;
        windowWidth = width;
        console.log(windowWidth)
        var simulationData = {categories:tmpXList,data:tmpSeriesList}
        lineChartTotal = new wxCharts({
          canvasId: 'lineCanvas',
          type: 'line',
          categories: simulationData.categories,
          animation: true,
          series: [{
              name: '总成绩',
              data: simulationData.data,
              format: function (val) {
                  return val+"分";
              }
          }],
          xAxis: {
              disableGrid: true
          },
          yAxis: {
              title: '总成绩',
              format: function (val) {
                  return val.toFixed(0);
              },
              min: 0
          },
          width: windowWidth,
          height: 200,
          dataLabel: false,
          dataPointShape: true,
          extra: {lineStyle: 'curve'}
        });
        /*linecharts六小科 */
        var simulationDataSix = {categories:tmpXList}
        lineChart = new wxCharts({
          canvasId: 'lineCanvasSix',
          type: 'line',
          categories: simulationDataSix.categories,
          animation: true,
          series: [
            {
              name: '物理',
              data: detailSeries.physics,
              format: function (val) {
                  return val+"分";
              }
            },
            {
              name: '历史',
              data: detailSeries.history,
              format: function (val) {
                  return val+"分";
              }
            },
            {
              name: '政治',
              data: detailSeries.politics,
              format: function (val) {
                  return val+"分";
              }
            },
            {
              name: '地理',
              data: detailSeries.geography,
              format: function (val) {
                  return val+"分";
              }
            },
            {
              name: '生物',
              data: detailSeries.biology,
              format: function (val) {
                  return val+"分";
              }
            },
            {
              name: '化学',
              data: detailSeries.chemistry,
              format: function (val) {
                  return val+"分";
              }
            }
          ],
          xAxis: {
              disableGrid: true
          },
          yAxis: {
              title: '分数',
              format: function (val) {
                  return val.toFixed(0);
              },
              min: 0
          },
          width: windowWidth,
          height: 200,
          dataLabel: false,
          dataPointShape: true,
          extra: {lineStyle: 'curve'}
        });
        /*语数英三科成绩折线图构造 */
        var simulationDataThree = {categories:tmpXList}
        lineChartThree = new wxCharts({
          canvasId: 'lineCanvasThree',
          type: 'line',
          categories: simulationDataThree.categories,
          animation: true,
          series: [
            {
              name: '语文',
              data: detailSeries.chinese,
              format: function (val) {
                  return val+"分";
              }
            },
            {
              name: '数学',
              data: detailSeries.math,
              format: function (val) {
                  return val+"分";
              }
            },
            {
              name: '英语',
              data: detailSeries.english,
              format: function (val) {
                  return val+"分";
              }
            }
          ],
          xAxis: {
              disableGrid: true
          },
          yAxis: {
              title: '分数',
              format: function (val) {
                  return val.toFixed(0);
              },
              min: 0
          },
          width: windowWidth,
          height: 200,
          dataLabel: false,
          dataPointShape: true,
          extra: {lineStyle: 'curve'}
        });
        /*雷达图 */
        radarChart = new wxCharts({
          canvasId: 'radarCanvas',
          type: 'radar',
          categories: ['语文', '数学', '英语','物理', '政治', '地理', '历史', '生物', '化学'],
          series: [
            {
              name: recentList.name,
              data: [parse(recentList.chinese)/150*100,parse(recentList.math)/150*100,parse(recentList.english)/150*100,parse(recentList.physics),parse(recentList.politics),parse(recentList.geography),parse(recentList.history),parse(recentList.biology),parse(recentList.chemistry)]
            }
          ],
          width: windowWidth,
          height: 200,
          extra: {
              radar: {
                  max: 100
              }
          },
          dataLabel:true
        });
        if(list.length==0){

        }
        wx.stopPullDownRefresh()
        /*小测成绩曲线  测试版 */
        db.collection('sscore').where({subject:"语文"}).get({
          success: function(res){
            console.log(res)
            if(res.data.length>0){
              console.log("小测成绩不为空")
              console.log(res)
              var list=[]
              var subject="语文"
              var categories=[]
              for(var i=0;i<res.data.length;i++){
                categories.push("")
                list.push(res.data[i].score)
              }
              console.log({list,categories})
              slineChart=that.sdrawLine(categories,list,subject)
            }
          },
          fail: function(res){
            console.warn(res)
          }
        })
      }
    },
    fail: function(res){
      console.error("获取用户信息失败");
      console.log(res);
    }
  });
  wx.stopPullDownRefresh()
    return null;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.autoUpdate()
  },
  autoUpdate: function() {
    var self = this
    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      //1. 检查小程序是否有新版本发布
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          //检测到新版本，需要更新，给出提示
          wx.showModal({
            title: '更新提示',
            content: '检测到新版本，修复若干问题，是否进行更新',
            success: function(res) {
              if (res.confirm) {
                //2. 用户确定下载更新小程序，小程序下载及更新静默进行
                self.downLoadAndUpdate(updateManager)
              } else if (res.cancel) {
                console.warn("用户取消了更新")
              }
            }
          })
        }
      })
    } else {
      console.warn("微信版本不支持自动更新")
    }
  },
  downLoadAndUpdate: function (updateManager){
    var self=this
    wx.showLoading({title:"正在更新"});
    //静默下载更新小程序新版本
    updateManager.onUpdateReady(function () {
      wx.hideLoading()
      //新的版本已经下载好，调用 applyUpdate 应用新版本并重启
      updateManager.applyUpdate()
    })
    updateManager.onUpdateFailed(function (res) {
      wx.hideLoading()
      // 新的版本下载失败
      wx.showModal({
        title: '更新失败',
        content: JSON.stringify(res)+'请截图并联系开发者。',
        showCancel: false
      })
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onLoad: function () {
    
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

  add: function(res){
    wx.navigateTo({
      url: '../form/form'
    })
  },

  list: function(res){
    wx.navigateTo({
      url: '../list/list'
    })
  },

  cloud: function(res){
    console.log("cloud函数被执行，即“学习资料云”按钮被点击")
    wx.navigateTo({
      url: '../cloud/cloud'
    })
  },

  touchHandler: function (e) {
    console.log(lineChart.getCurrentDataIndex(e));
    lineChart.showToolTip(e, {
        // background: '#7cb5ec',
        format: function (item, category) {
            return category + ' ' + item.name + ':' + item.data 
        }
    });
  },
  touchHandlerThree: function (e) {
    lineChartThree.showToolTip(e, {
        // background: '#7cb5ec',
        format: function (item, category) {
            return category + ' ' + item.name + ':' + item.data 
        }
    });
  },
  touchHandlerTotal: function (e) {
    lineChartTotal.showToolTip(e, {
        // background: '#7cb5ec',
        format: function (item, category) {
            return category + ' ' + item.name + ':' + item.data 
        }
    });
  },
  touchHandlerRadar: function (e) {
    radarChart.showToolTip(e, {
        // background: '#7cb5ec',
        format: function (item, category) {
            return category + ' ' + item.name + ':' + item.data 
        }
    });
  },
  
  createSimulationData: function () {
    var categories = [];
    var data = [];
    for (var i = 0; i < 10; i++) {
        categories.push('2016-' + (i + 1));
        data.push(Math.random()*(20-10)+10);
    }
    // data[4] = null;
    return {
        categories: categories,
        data: data
    }
  },
updateData: function () {
    var simulationData = this.createSimulationData();
    var series = [{
        name: '成交量1',
        data: simulationData.data,
        format: function (val, name) {
            return val.toFixed(0) + '万';
        }
    }];
    lineChart.updateData({
        categories: simulationData.categories,
        series: series
    });
  },
  version:function(){
    wx.openCustomerServiceChat({
      extInfo: {url: ''},
      corpId: '',
      success(res) {}
    })
  },
  code: function(){
    wx.navigateTo({
      url: '../code/code',
    })
  },
  face:function(){
    wx.startSoterAuthentication({
      requestAuthModes: ["facial"],
      challenge: '123456',
      authContent: '请进行指纹识别确认',
      success(res) {
        console.log(res)
      },
      fail(res){
        console.error(res)
      }
   })
  },
  onShareTimeline:function(){
    return {
      title: "PeterCoding小程序"
    }
  },
  sadd:function(){
    console.log("点击了小测新增")
    this.setData({hiddenmodalput:false})
  },
  bindPickerChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      sindex: e.detail.value,
      ssubject: this.data.sarray[e.detail.value]
    })
  },
  stext: function(e){
    console.log(e)
    this.setData({
      sscore: e.detail.value
    })
  },
  scancel:function(){
    this.setData({hiddenmodalput:true})
  },
  ssubmit:function(){
    const db = wx.cloud.database();
    const _ = db.command;
    const sscore = db.collection('sscore');
    var subject=this.data.ssubject
    var score=this.data.sscore
    var that=this
    sscore.add({
      data:{subject,score},
      success: function (res){
        console.log(res);
        that.setData({hiddenmodalput:true})
        wx.showModal({
          title: '提交成功',
          content: '成绩数据已成功提交至云端数据库。',
          showCancel: false,
          confirmText: '确定'
        });
      }
   });
  },
  bindChartPickerChange: function(e) {
    var that=this
    this.setData({
      sindex2: e.detail.value,
      ssubject2: this.data.sarray[e.detail.value]
    })
    const db = wx.cloud.database();
    const _ = db.command;
    db.collection('sscore').where({
      subject: this.data.sarray[e.detail.value]
    }).get({
      success: function(res){
        var list=[]
        var subject=that.data.sarray[e.detail.value]
        var categories=[]
        for(var i=0;i<res.data.length;i++){
          categories.push("")
          list.push(res.data[i].score)
        }
        if(list.length==0){
          list=[0]
          categories=[""]
        }
        //slineChart=that.sdrawLine(categories,lineChart,subject)
        slineChart.updateData({
          categories: categories,
          series: [{
            name: "成绩",
            data: list,
            format: function (val) {
                return val + '分';
            }
          }]
        });
      },
      fail: function(res){
        console.warn(res)
      }
    })
  },
  sdrawLine:function(categories,list,subject){
    var width=this.data.canvasWidth
    wx.createSelectorQuery().selectAll('.container').boundingClientRect(function (rect) {
      console.log("width：",rect[0].width)
      width=rect[0].width
    }).exec()
    var slineChart=new wxCharts({
      canvasId: 'slineCanvas',
      type: 'line',
      categories: categories,
      series: [{
          name: "成绩",
          data: list,
          format: function (val) {
              return val + '分';
          }
      }],
      yAxis: {
          title: '小测成绩',
          format: function (val) {
              return val;
          },
          min: 0
      },
      width: width,
      height: 200,
      extra: {
        lineStyle: 'curve'
      }
    });
    return slineChart
  },
  stouchHandler: function (e) {
    slineChart.showToolTip(e, {
        // background: '#7cb5ec',
        format: function (item, category) {
            return category + ' ' + item.name + ':' + item.data 
        }
    });
  },
  onAddToFavorites(res) {
    // webview 页面返回 webViewUrl
    console.log('webViewUrl: ', res.webViewUrl)
    return {
      title: '成绩助理',
      imageUrl: '../../images/logo.png',
      query: ''
    }
  }
})