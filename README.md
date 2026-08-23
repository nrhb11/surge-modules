# YouTube Premium-like for Surge Mac

一个保守的 YouTube 网页版 Surge 模块：

- 清理首页、搜索页和播放器广告数据。
- 隐藏 Premium 推销组件。
- 尝试显示 Premium 风格网页标识。
- 为网页播放器增加 PiP 画中画按钮。
- 保留观看历史、续播和正常播放统计。
- 不拦截 `googlevideo.com` 正片分片。
- 本地处理响应，不上传账号或浏览数据。

## 安装 URL

在 Surge Mac 的“模块”中选择“从 URL 安装”，粘贴：

```text
https://raw.githubusercontent.com/nrhb11/surge-youtube-premium-like/main/YouTube-Premium-Like.sgmodule
```

随后确认：

1. Surge 已生成并信任本机 MITM CA。
2. MITM、Rewrite、Scripting 已启用。
3. 系统代理或增强模式已启用。
4. 没有同时启用其他 YouTube 去广告模块。
5. 关闭全部 YouTube 标签页后重新打开。

默认参数：

- `hideShorts=false`
- `debug=false`

## 限制

这不会改变 Google 账号的真实订阅状态，也不能解锁离线下载、会员内容或服务器端 Premium 专属码率。YouTube 更新接口后，模块可能需要同步维护。

## 回滚

在 Surge 中停用或删除模块，随后完全刷新 YouTube。

## 文件

- `YouTube-Premium-Like.sgmodule`：Surge 模块入口。
- `youtube-premium-like.js`：响应清理和网页注入脚本。

## License

MIT
