const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})
exports.main = async (event, context) => {
  try {
    const result = await cloud.openapi.wxacode.get({
        "path": 'pages/cloud2/cloud?path='+event.path,
        "width": 430,
        "envVersion": 'release'
      })
    console.log(result)
    return result
  } catch (err) {
    return err
  }
}