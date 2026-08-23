# YouTube Ads Cleaner Universal for Surge

一个由自己的 GitHub 仓库完整托管的 Surge 模块，覆盖：

- macOS 的 YouTube 网页版：清理接口广告字段及首页内嵌的首屏广告数据；不注入页面脚本、样式或 Premium 外观，保证登录、菜单与播放来源完整。
- YouTube Music 网页版：保持 Safari 原生页面与请求头，只清理首页、搜索、队列和播放器接口中的广告；不修改 Music HTML 页面。
- iPhone / iPad 的 YouTube 与 YouTube Music App：清理 protobuf 响应广告字段，并写入画中画、后台播放能力字段。
- iPhone/iPad 由独立的移动端响应处理器清理广告并写入相关播放能力字段。
- 保留观看历史、续播和正常播放统计。
- 不拦截 `googlevideo.com` 正片分片，不使用第三方 Cloudflare Worker。

## 安装 URL

在 Surge 的“模块”中选择“从 URL 安装”，粘贴：

```text
https://raw.githubusercontent.com/nrhb11/surge-youtube-premium-like/main/YouTube-Premium-Like.sgmodule
```

随后确认：

1. Surge 已生成并信任本机 MITM CA；iPhone/iPad 还需安装证书并在系统设置中开启“完全信任”。
2. MITM、Rewrite、Scripting 已启用。
3. 设备流量确实经过这台 Surge，或 iOS/iPadOS 上直接运行 Surge。
4. 没有同时启用其他 YouTube 去广告模块。
5. 关闭 YouTube 网页或 App 后重新打开；旧缓存异常时再清理 YouTube 网站数据或重启 App。

默认参数：

- `hideShorts=false`
- `debug=false`

## 独立性与供应链

模块运行时只加载 `nrhb11/surge-youtube-premium-like` 仓库内的脚本。移动端处理器已经固定并内置在 `vendor/`，不再引用参考项目的 Raw URL；参考项目以后改名、删除或停止维护，不会直接导致本模块失效。

这不等于“永远不用维护”：YouTube 如果修改接口字段、protobuf 结构或反代理策略，任何去广告脚本都可能需要更新。仓库独立解决的是第三方源失效，不是 YouTube 协议永久不变。

## 旧规则的取舍

模块不再改写或 MITM `googlevideo.com` 媒体链路，避免拖慢视频、干扰字幕和正片播放。移动端去广告只处理 `youtubei.googleapis.com` 的应用响应；也没有加入会把加密初始化数据转发到第三方 Worker 的脚本。

## 限制

这不会改变 Google 账号的真实订阅状态，也不能解锁离线下载、会员内容或服务器端 Premium 专属码率。网页上的 Premium 字样是本地界面效果；App 的 PiP/后台播放取决于具体版本、地区和 YouTube 服务端校验。

## 回滚

在 Surge 中停用或删除模块，随后完全刷新 YouTube 或重启 App。

## 文件

- `YouTube-Premium-Like.sgmodule`：Mac + iPhone/iPad 通用入口。
- `youtube-premium-like.js`：纯接口 JSON 广告清理脚本，不注入网页、不改 Logo、不伪装 Premium 外观。
- `youtube-home-response.js`：只改写首页已有的 `ytInitialData`，删除首屏广告节点并保留原有 CSP；不注入任何页面代码。
- `youtube-web-request.js`：修复旧缓存页面可能产生的 `Origin: null`，不修改 Cookie 或请求正文。
- `vendor/youtube-mobile-response.js`：仓库内置的移动端 protobuf 响应处理器。
- `NOTICE`、`vendor/LICENSE-APACHE-2.0`：第三方代码来源与许可证。

## License

本项目自有代码使用 MIT License。`vendor/youtube-mobile-response.js` 按 Apache License 2.0 使用，详见 `NOTICE`。
