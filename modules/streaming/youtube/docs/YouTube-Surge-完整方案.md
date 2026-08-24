# 用 Surge 去除 YouTube 网页版广告

## 结论

单靠 DNS 或域名规则，不能稳定去除 YouTube 播放器广告。YouTube 的广告指令来自播放器接口，视频广告还可能与正片共用 YouTube/Google Video 基础设施。直接屏蔽 `youtube.com`、`youtubei.googleapis.com` 或 `googlevideo.com`，通常只会得到黑屏、转圈和播放失败。

可行方案是：Surge Mac 对少量 YouTube 域名进行 HTTPS 解密，然后同时做三层处理：

1. 清理 `youtubei` 播放器响应里的广告字段。
2. 改写首次返回的网页 HTML，注入页面级处理逻辑。
3. 对仍然出现的广告状态自动静音、点击跳过或跳到广告末尾。

这不是永久保证。YouTube 会持续修改接口，并已采用或测试更难拦截的服务端广告方案。要求长期零维护、跨设备稳定无广告，只有 YouTube Premium 是官方保证的路线。

## 本方案为什么没有照搬旧 Userscript

旧脚本仍有四个可用思想：CSS 隐藏广告组件、监听 `ad-showing`、点击跳过按钮、把广告播放位置推到末尾。

但它有明显缺陷：

- 它是浏览器 Userscript，依赖 `window`、`document` 和 DOM，不能直接作为 Surge 响应脚本运行。
- 只在广告已经进入页面后处理，缺少播放器 JSON 清理，所以容易先闪出广告或遇到黑屏。
- 监听整个 `document.body` 的全部子树变化，YouTube 长时间打开时开销较大。
- 删除反广告拦截弹窗属于脆弱的 DOM 补丁，YouTube 一改结构就失效。

本方案把相同思想放到 Surge 的 HTML 注入层，并补上 JSON 清理层；同时不屏蔽视频 CDN 分片。

## 对第二份 Premium Lite² 脚本的审计

这份脚本比第一份更接近现代 YouTube 去广告方案。以下设计有效，而且当前 Surge 方案已经覆盖：

- 在 `document-start` 阶段尽早接管页面。Surge 版本是在返回 HTML 的 `<head>` 后立即注入逻辑。
- 清理 `ytInitialPlayerResponse`、`ytInitialData` 中的 `adPlacements`、`playerAds`、`adSlots` 等字段。
- 处理后续的 `fetch`、XHR 和 `Response.json()` 播放器响应。
- 监听 `yt-navigate-finish`，适配 YouTube 不重新加载整个网页的单页路由。
- 隐藏首页、搜索页、播放页的推广卡片和广告容器。

以下设计没有合并，因为风险高于收益：

- 全局替换 `JSON.parse`：YouTube 页面中所有 JSON 都会经过递归扫描，容易造成性能问题或误改非广告数据。
- 全局替换 `DOMTokenList.prototype.add`：阻止播放器加入 `ad-showing` 类并不等于广告流消失，反而可能让播放器状态失真。
- 拦截所有带 `ctier` 参数的 `googlevideo.com/videoplayback`：参数不是足够可靠的广告身份证，可能拒绝正片分片。
- 伪造 XHR 的只读状态字段和 204 响应：浏览器实现差异较大，容易卡住播放器状态机。
- 深度递归删除所有疑似 enforcement/interrupt 弹窗：可能误删正常确认对话框，也掩盖真正的兼容故障。
- 修改 Premium 标志、重排首页网格：与去广告无关，增加维护面。

结论：第二份脚本证明“三层拦截”方向正确，但不应整份移植。保守方案只吸收它的接口拦截和 SPA 生命周期思路。

## 安装

1. 使用较新的 Surge Mac。打开系统代理或增强模式，确认网页流量确实经过 Surge。
2. 在 Surge 的 HTTPS 解密/MITM 页面生成本机 CA，并按系统提示加入并信任钥匙串。不要从别人那里下载 CA，也不要开启 `skip-server-cert-verify`。
3. 打开 Surge 的“模块”，新增本地模块，选择 `YouTube-Web-NoAds-Conservative.sgmodule`。
4. 参数建议保持：`hideShorts=false`、`debug=false`。
5. 确认 MITM、Rewrite 和 Scripting 三个功能总开关均已启用。
6. 完全关闭所有 YouTube 标签页，再重新打开。首次测试建议强制刷新一次。

如果你要使用“类似 Premium”的增强版，请改为启用 `YouTube-Premium-Like-Local.sgmodule`，并保证同一时间只启用一个 YouTube 去广告模块。增强版的本地脚本路径已经指向本机输出目录，因此不要单独移动 `youtube-premium-like.js`；如果移动，必须同步修改模块里的 `script-path`。

增强版额外提供：

- Premium 风格网页标识。
- 隐藏 Premium 推销组件。
- 在播放器右侧控制区增加 `PiP` 画中画按钮。
- 所有处理逻辑保存在本地脚本中，不会向第三方服务器发送请求。

它不会改变 Google 账号的真实订阅状态，也不能解锁离线下载、Premium 专属码率、会员内容或其他服务器端权限。桌面浏览器本身已经支持后台标签页播放；macOS 是否继续播放还会受浏览器和系统节能策略控制。

Surge 会自动阻断命中 MITM 主机的 QUIC/HTTP3，让浏览器回落到可解密的 HTTP/2 或 HTTP/1.1；一般不需要手工封 UDP 443。

## 如何验证

连续打开 5 到 10 个通常有贴片广告的视频，并观察：

- 首页、搜索结果和播放页侧栏不再出现推广卡片。
- 片头或中插广告不播放，或仅出现极短的黑场后自动进入正片。
- Surge 请求记录中，`youtubei/v1/player`、`get_watch` 或 `watch` 请求显示命中对应响应脚本。
- 观看历史、续播位置、评论、登录、字幕与清晰度保持正常。

如果只隐藏了页面广告，但播放器广告仍出现，基本不是“规则少了”，而是 MITM/脚本没有命中，或该账号进入了新的服务端广告实验。

## 故障处理

### 广告完全没变化

检查 Surge 是否接管浏览器流量、CA 是否被系统信任、MITM/Rewrite/Scripting 是否启用。然后强制刷新 YouTube，查看 `youtubei/v1/player` 是否命中脚本。

### 黑屏、转圈或视频无法播放

先检查并删除其他配置中针对以下目标的拒绝规则：

- `googlevideo.com`
- `youtube.com`
- `youtubei.googleapis.com`
- 带 `ctier=L`、`oad` 的 Google Video 分片 Map Local 规则

本方案故意不使用这些“猛药”。它们可能暂时挡住服务端广告，也最容易误伤正片。

### 视频恢复后没有声音

刷新当前页面；若反复出现，先停用本模块再启用。原因通常是广告静音状态没有被 YouTube 播放器正确复位。

### 观看历史或续播异常

检查是否还启用了其他 YouTube 去广告模块。很多公开模块会拒绝 `api/stats/watchtime` 或 `api/stats/playback`；本保守版明确保留这两类请求。

### 某天突然失效

不要立刻扩大 MITM 到 `*.google.com`，也不要整域屏蔽 `googlevideo.com`。先停用模块确认 YouTube 原生播放正常，再查看上游脚本是否有新版。升级前应比较代码差异；当前模块故意固定在已检查的版本，不会自动切换到未经检查的新代码。

## 回滚

在 Surge 中停用或删除这个模块，然后完全刷新 YouTube。若不再使用任何 HTTPS 改写功能，可再关闭 MITM；不必删除整个 Surge 配置。

## 能力边界

- 首页/搜索/侧栏展示广告：成功率高。
- 传统播放器贴片和中插广告：通常有效，但可能有极短空白或偶发漏网。
- 服务端拼接广告：无法保证；网络层越来越难把它与正片安全区分。
- 视频作者口播、植入和赞助片段：无法识别，因为它们就是正片内容。

## 参考

- [Surge：HTTPS Decryption](https://manual.nssurge.com/http/mitm.html)
- [Surge：Scripting](https://manual.nssurge.com/scripting/overview.html)
- [Surge：Module](https://manual.nssurge.com/profile/module.html)
- [上游网页处理脚本及版本记录](https://gist.github.com/oiiogong/3b2f171141b54027e5db9a543b09b194)
- [YouTube 官方：Premium 无广告权益](https://support.google.com/youtube/answer/6308116)
