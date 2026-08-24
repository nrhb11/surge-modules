# Surge Modules Hub

> ⚡ 个人自用与维护的 Surge (Mac / iOS / iPadOS) 模块与规则脚本集中管理仓库。所有模块均通过本仓库独立托管，支持一键通过 URL 订阅与自动更新。

---

## 📦 模块总览与一键安装

| 分类 | 模块名称 | 适用平台 | 功能说明 | Surge 安装 URL (Raw) | 文档 |
| :--- | :--- | :--- | :--- | :--- | :---: |
| 🎬 **影音视听** | **YouTube Premium-like** | Mac / iOS / iPadOS | 网页及 App 去广告、画中画(PiP)、后台播放、保留历史进度 | `https://raw.githubusercontent.com/nrhb11/surge-modules/main/modules/streaming/youtube/YouTube-Premium-Like.sgmodule` | [详情](modules/streaming/youtube/README.md) |
| 🛡️ **广告与隐私** | *待扩展* | - | 通用广告过滤、追踪拦截等 | - | - |
| 🌐 **网络与分流** | *待扩展* | - | DNS 优化、GEOIP 分流扩展等 | - | - |
| 🛠️ **实用工具** | *待扩展* | - | 面板信息、自动化脚本等 | - | - |

---

## 🚀 如何在 Surge 中安装模块

1. **复制 URL**：在上方表格中复制对应模块的 `Surge 安装 URL`。
2. **导入 Surge**：
   - **Surge Mac**：点击菜单栏图标 -> `配置 (Configuration)` -> `模块 (Modules)` -> `从 URL 安装 (Install from URL...)`，粘贴 URL 并保存。
   - **Surge iOS / iPadOS**：打开 Surge -> `首页 (Home)` -> `模块 (Modules)` -> `从 URL 安装`，粘贴并启用。
3. **前置条件检查**：
   - 确保已开启 **MITM** 并已信任 **Surge CA 证书**（iOS 需在“设置 -> 通用 -> 关于本机 -> 证书信任设置”中完全信任）。
   - 确保 **Rewrite** 与 **Scripting (脚本)** 已处于启用状态。
4. **参数微调**：点击已安装的模块即可展开图形化参数设置（例如 Shorts 开关、调试模式等）。

---

## 📂 仓库目录结构

```
surge-modules/
├── README.md                               # 模块索引总览与使用指南
├── LICENSE                                 # 仓库开源许可证 (MIT)
├── NOTICE                                  # 第三方组件来源与版权声明
├── modules/                                # 模块主目录
│   ├── streaming/                          # 🎬 影音流媒体类模块
│   │   └── youtube/                        # YouTube 去广告与增强
│   │       ├── YouTube-Premium-Like.sgmodule
│   │       ├── README.md
│   │       ├── scripts/                    # 纯自研/本地脚本
│   │       └── vendor/                     # 固化的第三方依赖
│   ├── privacy/                            # 🛡️ 隐私保护与广告拦截模块
│   ├── network/                            # 🌐 网络优化、DNS 与分流规则
│   └── utilities/                          # 🛠️ 生产力、面板与辅助工具
├── tests/                                  # 自动化测试套件
└── YouTube-Premium-Like.sgmodule           # 根目录兼容文件（兼容历史旧链接）
```

---

## 🧩 模块开发与扩展规范

当需要向本仓库新增模块时，遵循以下规范：

1. **分类存放**：在 `modules/<分类>/<模块名>/` 下创建模块目录。
2. **独立依赖**：所有 `.sgmodule` 中调用的 JavaScript 脚本均存放在对应模块的 `scripts/` 或 `vendor/` 目录下，`script-path` 统一使用本仓库的 `raw.githubusercontent.com/nrhb11/surge-modules/main/...` 链接。
3. **参数化配置**：尽量使用 `#!arguments` 和 `#!arguments-desc` 提供可配置开关，增强模块灵活性。
4. **单元测试**：针对复杂的响应改写或 Protobuf 处理，在 `tests/` 中编写对应的 Node.js 测试用例。
5. **更新索引**：在根目录 `README.md` 的表格中添加新模块条目与安装 URL。

---

## 📄 License

- 本仓库自有代码与模块配置均遵循 [MIT License](LICENSE)。
- 第三方组件与引用库遵循原作者开源协议，详见 [NOTICE](NOTICE)。
