# YouTube Premium-like Universal for Surge

一个由本仓库完整独立托管的 Surge 模块，覆盖：

- **macOS YouTube 网页版**：清理接口广告字段及首页内嵌的首屏广告数据；不注入页面脚本、样式或伪装 Premium 外观，保证登录、菜单与播放来源完整。
- **YouTube Music 网页版**：保持 Safari 原生页面与请求头，只清理首页、搜索、队列和播放器接口中的广告；不修改 Music HTML 页面。
- **iPhone / iPad YouTube & Music App**：使用仓库内置的原版移动处理器，清理广告并支持画中画 (PiP) 与后台播放能力。
- **正片保护**：保留已验证有效的 `ctier/oad` 视频广告兜底，普通 `videoplayback` 正片明确排除，不影响播放缓冲与画质。
- **历史记录正常**：保留观看历史、续播进度与播放统计。

---

## 🚀 安装 URL

在 Surge 的 **模块 (Modules)** 中选择 **“从 URL 安装 (Install from URL)”**，粘贴：

```text
https://raw.githubusercontent.com/nrhb11/surge-modules/main/modules/streaming/youtube/YouTube-Premium-Like.sgmodule
```

### 前置确认项：
1. Surge 已生成并信任本机 **MITM CA 证书**（iPhone/iPad 还需在系统“设置 -> 通用 -> 关于本机 -> 证书信任设置”中开启“完全信任”）。
2. Surge 已启用 **MITM**、**Rewrite** 与 **Scripting (脚本)**。
3. 确保没有同时启用其他 YouTube 去广告模块，避免冲突。
4. 安装/更新后，建议彻底重启 YouTube App 或刷新网页。

---

## ⚙️ 可配置参数

在 Surge 模块列表中点击该模块即可调整参数：

| 参数 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `hideShorts` | `false` | 是否在首页和推荐流中隐藏 Shorts 短视频 |
| `debug` | `false` | 是否输出脚本调试日志至 Surge 日志 |

---

## 📁 目录结构

```
modules/streaming/youtube/
├── YouTube-Premium-Like.sgmodule          # 模块主配置文件
├── README.md                              # 模块说明文档
├── scripts/
│   ├── youtube-premium-like.js            # 纯接口 JSON 广告清理（Web/Music）
│   ├── youtube-home-response.js           # 首页首屏 ytInitialData 数据净化
│   └── youtube-web-request.js             # Web 跨域与 Origin 请求头修复
└── vendor/
    ├── youtube-mobile-response.js         # 固化的移动端 Protobuf 响应处理器
    └── LICENSE-APACHE-2.0
```

---

## 📄 License

- 自有脚本与规则采用 [MIT License](../../../LICENSE)。
- `vendor/youtube-mobile-response.js` 遵循 Apache License 2.0，详见 [NOTICE](../../../NOTICE)。
