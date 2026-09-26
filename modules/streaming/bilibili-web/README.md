# Bilibili 网页版去广告（Surge）

为 Bilibili **网页版**准备的独立 Surge 模块，覆盖 `www.bilibili.com` 首页和视频页、`search.bilibili.com` 搜索页，以及 `live.bilibili.com` 首页。它不会修改 Bilibili App 的接口，也不保证对 macOS 桌面客户端生效。

## 安装

在 Surge 的“模块”中选择“从 URL 安装”，使用：

```text
https://raw.githubusercontent.com/nrhb11/surge-modules/main/modules/streaming/bilibili-web/Bilibili-Web-Adblock.sgmodule
```

启用 MITM、Rewrite 和 Scripting，并确保浏览器信任 Surge CA 证书；随后刷新 Bilibili 页面。模块仅把 `www.bilibili.com`、`search.bilibili.com`、`live.bilibili.com` 和 `api.bilibili.com` 加入 MITM 主机列表。若同时启用了其他 Bilibili 响应脚本，Surge 每个响应只执行第一个匹配的脚本，需检查脚本优先级。

## 功能与边界

| 位置 | 默认处理 |
| --- | --- |
| 首页推荐流 | 过滤推荐接口中带有明确广告标记的项目；隐藏指向 `cm.bilibili.com/cm/api/` 的广告卡片及轮播广告项；隐藏轮播图中的“被 AdGuard/AdBlock 类插件屏蔽”提示和直播卡片 |
| 搜索结果 | 隐藏指向上述广告跳转接口的结果卡片 |
| 视频页 | 隐藏已核对的侧栏、浮层和横幅广告容器 |
| 直播首页 | 隐藏明确标为广告的横幅；顶部推广播放器可选隐藏 |

页面样式是注入 HTML 的 CSS，能处理后来动态加载的同类元素；不会拦截登录脚本、改写播放器、删除普通推荐视频或扫描 DOM。CSS 隐藏的项目仍可能由网站请求；这不是全站网络请求屏蔽器。网站改版、广告标记变化、HTML 超过 5 MiB，或浏览器没有经过 Surge MITM 时，部分广告可能保留。

## 参数

| 参数 | 默认值 | 效果 |
| --- | --- | --- |
| `hideHomeLive` | `true` | 隐藏首页推荐区域中的直播卡片；设为 `false` 可恢复 |
| `hideCarousel` | `false` | 隐藏首页整个轮播图，包括非广告内容 |
| `hideLivePromo` | `false` | 隐藏直播首页顶部推广播放器 |

## 来源

选择器位置参考了 aspen138 的 MIT 授权油猴脚本[《隐藏哔哩哔哩的广告和推广区域》](https://greasyfork.org/zh-CN/scripts/485350)。本模块脚本是独立实现，没有直接复制其 GM API、DOM 观察器、播放器或登录拦截代码。
