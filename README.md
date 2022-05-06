# PeterCoding小程序

## 简介
PeterCoding小程序发布于微信平台，目前有两个主要功能
1. 提供给每一位用户独立的成绩数据管理与分析功能
2. 各用户的学习资料共享与查看

## 功能详解

### 一、成绩数据管理
1. **基本的增删查改功能**：在首页点击`数据列表`查看已经录入的数据，同时可以进行数据的删除与修改操作
2. **数据分析**：首页`成绩助理`页面绘制了总成绩、各单科成绩的历史数据折线图以及最近一次考试的雷达图供用户浏览

### 二、资料共享
1. **查看资料库**：目前已建立比较完善的高中学习资料库，点击`公有资料`页面即可查看，实现基本文件预览功能
> 受限于微信的接口能力，很多功能难以实现，将逐步尽力推进

2. **分享资料**：通过`其它方式打开`或者`内部云`页面，用户可以上传自己的资料，经审核后可以并入公有资料库

## 升级计划
- [x] 支持电脑版预览文档（COS的API）
- [x] 内部云文件有限查看
- [x] 内部云上传进度条
- [x] 云空间列表左右滑动查看长文件名
- [x] 云空间横屏时显示更多功能
- [x] 云空间列表显示更多信息
- [x] 密钥上云，增强安全性
- [x] COS对象转全局变量
- [x] 尝试变相监听返回键

## 更新日志
<details>
<summary>2022.05.04(v4.1.2)</summary><br>
· 优化 响应式UI设计<br>
· 优化 横屏状态下UI显示<br>
· 修复 长按与点击事件冲突<br>
· 优化 文件名滑动显示<br>
· 修复 若干已知问题<br>
</details>

<details>
<summary>2022.04.22(v4.1.1)</summary><br>
· 新增 测试返回键返回上级目录功能<br>
· 修复 文件重复显示嵌套循环<br>
· 优化 子页面UI统一<br>
</details>

<details>
<summary>2022.04.18(v4.1.0)</summary><br>
· 修复 转PDF预览乱码问题<br>
· 优化 统一全局UI设计<br>
· 优化 云空间文件滑动展示<br>
· 新增 内部云页面公告<br>
</details>

<details>
<summary>其它历史版本更新日志</summary><br>
· 修复 转PDF预览乱码问题<br>
· 优化 统一全局UI设计<br>
· 优化 云空间文件滑动展示<br>
· 新增 内部云页面公告<br><br>
2022.04.14(v4.0.7)<br>
· 修复 内存溢出问题<br>
· 新增 电脑端显示更多按钮<br>
· 修复 电脑端保存文件到本地<br>
· 修复 分享文件乱码问题<br>
· 优化 各功能下载进度条<br><br>
2022.04.10(v4.0.6)<br>
· 修复 PC端ppt文件上传失败<br>
紧急修复，补充修改<br><br>
2022.04.09(v4.0.5)<br>
· 新增 适配PC端更多格式预览<br>
· 优化 内部云界面设计<br>
· 修复 部分已知错误<br>
· 新增 资料库长按菜单<br><br>
2022.04.02(v4.0.4)<br>
· 修复 目录分享无法重进<br><br>
2022.03.28(v4.0.3)<br>
· 优化 页面缓冲提示逻辑<br>
· 修复 大文件下载失败<br><br>
2022.03.20(v4.0.2)<br>
· 优化 资料库错误提示<br>
· 新增 资料库日期大小显示<br>
· 新增 资料库更多功能<br>
· 修复 大文件无法预览<br>
· 新增 判断更新逻辑<br><br>
2022.02.26(v4.0.1)<br>
· 新增 高考倒数日期设置<br>
· 新增 内部云文件上传分类文件夹<br>
· 修复 首页支持自动刷新<br>
· 优化 兼容适配低版本设备（最低2.4.4基础库）<br><br>
2022.02.10(v4.0.0)<br>
· 优化 更新云存储sdk版本<br>
· 新增 意见反馈入口<br>
· 新增 更多文件格式上传<br>
· 新增 链接分享上传<br>
· 新增 部分页面下拉刷新<br>
· 新增 基本适配黑暗模式<br>
· 新增 基本适配PC端显示<br>
· 优化 页面逻辑和代码逻辑<br>
· 修复 内部云外部素材打开BUG<br>
· 新增 内部云上传进度条<br>
· 优化 提升程序安全性<br>
· 优化 提升程序性能与响应速度<br>
· 新增 查看内部云文件<br><br>
2022.02.08(v3.5.0)<br>
· 新增 小测成绩录入与图表<br>
每一次小测都值得关注<br>
· 新增 其它文档打开小程序直接投稿（测试中）<br>
可以在“其它打开方式”选择PeterCoding上传PDF资料进行投稿<br>
· 优化 代码结构与注释<br><br>
2022.02.07(v3.4.1)<br>
· 优化 搜索功能UI<br>
· 新增 内部云多文件上传（最多100个）<br>
· 新增 内部云图片上传选项<br>
· 优化 内部云文件上传逻辑<br>
· 新增 小测成绩录入<br>
· 新增 小测成绩曲线（未完工）<br><br>
2022.01.28(v3.4.0)<br>
· 新增 公有云资料库支持搜索了<br>
搜索功能支持js正则表达式，忽略大小写<br><br>
2022.01.24(v3.3.5)<br>
· 修复 内部云偶现未知错误<br><br>
2022.01.23(v3.3.4)<br>
· 新增 分离内部云与公有云<br>
· 优化 操作逻辑<br><br>
2022.01.20（v3.3.3）<br>
· 新增 图片预览支持列表<br>
· 新增 资料分享上传Beta版<br>
· 修复 音频文件预览失败问题<br>
· 删除 微信不支持预览的文件<br>
部分文件微信不支持预览<br>
请复制链接到浏览器下载<br><br>
2021.10.17（V3.3.2）<br>
· 新增 多个数据图表<br>
· 删除 无用元素和函数<br>
· 修复 文件名乱码问题<br>
· 修复 首页无法滑动问题<br>
· 优化 页面逻辑<br>
</details>