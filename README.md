# multimodal-study

**一套零依赖、零构建的多模态机器学习中文学习网站：156 篇论文精读笔记 + 8 周学习计划 + 每周测验，浏览器打开就能学。**

> **English Summary** — `multimodal-study` is a zero-dependency, build-free static site for learning multimodal machine learning in Chinese. It ships 183 original study documents (guides, topic surveys, paper notes, glossary, 8-week plan), weekly quizzes with auto-grading, a mistake book, reading-progress tracking, and optional GitHub Gist sync across devices. Just open `index.html`, or run `npm run dev` for a local preview on port 7100. See [README_EN.md](README_EN.md) for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<!-- TODO: 补充功能截图
![功能截图](docs/screenshot.png)
-->

## ✨ 特性

- **📚 183 篇中文学习文档**：入门导读 3 篇、主题综述 13 篇、论文精读笔记 156 篇、术语词典 1 篇、学习计划 1 篇、分周学习文档 8 篇
- **🗓️ 8 周学习计划**：内置分周阅读清单与打卡功能，进度一目了然
- **📖 沉浸式阅读器**：317 条术语支持悬浮解释，阅读时随时查词
- **📝 每周测验**：8 周 × 24 题 = 192 道测验题，自动判分
- **📕 错题本 + 📒 笔记本**：错题自动收录便于复习，笔记支持导出
- **📊 进度仪表盘**：学习时长统计与整体进度可视化
- **☁️ 多端同步**：通过 GitHub Gist 在多设备间同步学习数据
- **💾 数据导出 / 导入**：学习数据完全掌握在自己手里
- **⚡ 零依赖零构建**：原生 HTML / CSS / JavaScript 单页应用，无任何第三方依赖，双击即用
- **🦞 OpenClaw 提醒对接**：可接入 OpenClaw（龙虾）每日学习提醒，详见 [openclaw/README.md](openclaw/README.md)

## 🚀 快速开始

### 方式一：直接打开（最简单）

无需安装任何东西，双击 `index.html` 即可在浏览器中使用。

### 方式二：本地预览服务器（推荐）

需要本机装有 Node.js：

```bash
git clone https://github.com/mutou/multimodal-study.git
cd multimodal-study
npm run dev
```

然后在浏览器访问 `http://localhost:7100`。如需更换端口：

```bash
node server.js 8080        # 命令行参数指定端口
PORT=8080 npm run dev      # 或通过环境变量
```

### 方式三：部署到 GitHub Pages

1. 将仓库推送到 GitHub。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 下，Source 选择 **Deploy from a branch**，分支选择 **main**，目录选择 **/ (root)**，保存。
4. 稍等片刻，即可通过 `https://<你的用户名>.github.io/multimodal-study/` 访问。

> 站点为纯静态页面，无需任何构建步骤，GitHub Pages 直接托管即可。

## 📖 使用指南

推荐的学习流程：

1. **导读**：先读 3 篇入门导读，建立多模态学习的整体认知。
2. **计划**：查看 8 周学习计划，按周推进，完成阅读后打卡。
3. **阅读**：在阅读器中精读论文笔记，遇到术语可悬浮查看解释，随手记笔记。
4. **测验**：每周结束后完成当周 24 题测验，系统自动判分。
5. **错题复习**：定期回顾错题本，巩固薄弱环节；学习进度和时长可在仪表盘查看。

## ☁️ 多端同步

网站支持通过 **GitHub Gist** 在多台设备之间同步学习数据（进度、笔记、错题等）：

1. 前往 GitHub **Settings → Developer settings → Personal access tokens**，生成一个 Token。
2. 该 Token **只需要勾选 `gist` 权限**，无需授予任何仓库权限。
3. 在网站的同步设置中填入 Token 即可开始使用。

> Token 仅存储在你本地浏览器中，请妥善保管，不要泄露给他人。

## 🦞 OpenClaw 每日提醒

网站预留了与 OpenClaw（龙虾）每日提醒的对接模块，配置方式请参阅 [openclaw/README.md](openclaw/README.md)。

## 📁 项目结构

```
multimodal-study/
├── index.html            # 应用入口（单页应用）
├── server.js             # 零依赖静态文件服务器（node:http，默认端口 7100）
├── package.json          # npm run dev 启动本地预览
├── assets/
│   ├── js/               # 前端逻辑
│   └── style.css         # 样式
├── data/
│   ├── content.js/json   # 183 篇学习文档的渲染数据
│   ├── glossary.js/json  # 317 条术语词典
│   ├── plan.js/json      # 8 周阅读清单
│   └── quiz/
│       └── week1-8.js/json  # 每周 24 题，共 192 题
└── openclaw/             # OpenClaw（龙虾）每日提醒对接模块
```

## 🛠️ 技术栈

- **前端**：原生 HTML / CSS / JavaScript 单页应用，零第三方依赖、零构建步骤
- **本地服务器**：Node.js 内置 `node:http` 模块（`server.js`），同样零依赖
- **数据格式**：JSON（配套 `.js` 包装供浏览器直接加载）
- **同步**：GitHub Gist API

## ⚠️ 内容免责声明

本站所有学习笔记均为**以学习为目的的原创中文整理**，基于公开的 arXiv 论文撰写。仓库中**不包含任何论文 PDF 原文**，仅保留 arXiv 编号作为引用出处。所涉论文的版权归原出版方及原作者所有。本站内容仅供个人学习交流使用，不构成任何学术或投资建议。如内容存在侵权问题，请通过 Issue 联系我们，我们将在核实后第一时间删除。

## 🤝 贡献指南

欢迎纠错、补充题库和完善文档！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解提 Issue、提交 PR 和内容纠错的流程。

## ⭐ Star 历史

<!-- TODO: 仓库公开后替换为实际的 Star History 图表
[![Star History Chart](https://api.star-history.com/svg?repos=mutou/multimodal-study&type=Date)](https://star-history.com/#mutou/multimodal-study&Date)
-->

## 📄 License

[MIT](LICENSE) © 2026 mutou
