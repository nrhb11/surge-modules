# YouTube Premium-like Universal for Surge

一个由自己的 GitHub 仓库完整托管的 Surge 模块，覆盖：

- macOS 的 YouTube 网页版：清理首页、搜索页、播放页广告数据与广告空壳。
- YouTube Music 网页版：修正 Google 对新版 Safari 的错误降级判断，并清理首页、搜索、队列和播放器接口中的广告；不修改 Music HTML 页面。
- 网页界面：隐藏 Premium 推销入口，显示 Premium 风格标识，增加 PiP 按钮。
- iPhone / iPad 的 YouTube 与 YouTube Music App：清理 protobuf 响应广告字段，并写入画中画、后台播放能力字段。
- 对仍使用 `ctier/oad` 播放链路的 iPhone/iPad 版本，增加视频 CDN 广告兜底；明确排除常规 `videoplayback` 正片入口。
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

移动端保留了已验证可用的 `ctier=L` 与 `oad` 兜底，但 `oad` 明确排除 `videoplayback` 正片入口。模块不拦截普通正片分片，也没有加入会把加密初始化数据转发到第三方 Worker 的脚本。

## 限制

这不会改变 Google 账号的真实订阅状态，也不能解锁离线下载、会员内容或服务器端 Premium 专属码率。网页上的 Premium 字样是本地界面效果；App 的 PiP/后台播放取决于具体版本、地区和 YouTube 服务端校验。

## 回滚

在 Surge 中停用或删除模块，随后完全刷新 YouTube 或重启 App。

## 文件

- `YouTube-Premium-Like.sgmodule`：Mac + iPhone/iPad 通用入口。
- `youtube-premium-like.js`：自有网页响应清理与页面增强脚本。
- `youtube-music-request.js`：YouTube Music 的 Safari 请求头兼容脚本；只替换 User-Agent，保留 Cookie 与其他请求头。
- `vendor/youtube-mobile-response.js`：仓库内置的移动端 protobuf 响应处理器。
- `NOTICE`、`vendor/LICENSE-APACHE-2.0`：第三方代码来源与许可证。

## License

本项目自有代码使用 MIT License。`vendor/youtube-mobile-response.js` 按 Apache License 2.0 使用，详见 `NOTICE`。
