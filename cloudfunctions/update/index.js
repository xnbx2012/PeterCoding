// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const formData=context;
  console.log("cloud");
  console.log(formData);
  const db = wx.cloud.database();
  const _ = db.command;
  const score=db.collection('score').where({
    _openid: _.eq(formData.userId),
    name: _.eq(formData.name)
  });
  const result=score.update({data:formData});
  console.log(result);

  return {
    result
  }
}