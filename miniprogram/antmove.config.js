module.exports = {
    "env": "development",
    "type": "wx-alipay",
    "error": true,
    "input": "./",
    "output": "..\\antmove_miniprogram"
,
    "hooks": {
        "appJson": function plugin (appJson) {return appJson}

    },
    "babel": {
        "plugins": []
    }
}