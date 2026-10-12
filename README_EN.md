# multimodal-study

**A zero-dependency, build-free static site for learning multimodal machine learning in Chinese — 156 paper notes, an 8-week plan, and weekly quizzes. Just open it in your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> 中文文档请见 [README.md](README.md)。Note: all learning content is written in Chinese; this README covers setup and usage only.

## Features

- **183 Chinese study documents**: 3 beginner guides, 13 topic surveys, 156 paper notes, 1 glossary doc, 1 study plan, 8 weekly docs
- **8-week study plan** with check-in tracking
- **Reader** with hover explanations for 317 glossary terms
- **Weekly quizzes**: 8 weeks × 24 questions = 192 questions, auto-graded
- **Mistake book & notebook** (notes exportable)
- **Progress dashboard** with study-time statistics
- **Cross-device sync** via GitHub Gist, plus full data export / import
- **Zero dependencies, zero build** — vanilla HTML/CSS/JS SPA
- Optional **OpenClaw daily reminders** (see `openclaw/README.md`)

## Quick Start

**Option 1 — Just open it**: double-click `index.html`.

**Option 2 — Local preview server** (Node.js required):

```bash
git clone https://github.com/mutou/multimodal-study.git
cd multimodal-study
npm run dev        # serves on http://localhost:7100
```

Custom port: `node server.js 8080` or `PORT=8080 npm run dev`.

**Option 3 — GitHub Pages**: push to GitHub, then go to **Settings → Pages**, choose **Deploy from a branch**, select the `main` branch and `/ (root)`. The site is fully static — no build step needed.

## How to Learn

Guides → 8-week plan → read paper notes (hover terms, take notes) → weekly quiz → review your mistake book. Track progress and study time on the dashboard.

## Cross-Device Sync

Sync uses **GitHub Gist**. Create a personal access token with the **`gist` scope only** and paste it into the sync settings. The token is stored only in your own browser.

## Project Structure

```
multimodal-study/
├── index.html            # App entry (SPA)
├── server.js             # Zero-dependency static server (node:http, port 7100)
├── package.json
├── assets/               # js/ + style.css
├── data/                 # content / glossary / plan / quiz (js + json)
└── openclaw/             # OpenClaw reminder integration (WIP)
```

## Content Disclaimer

All notes are **original Chinese study notes** written for learning purposes, based on public arXiv papers. This repository contains **no paper PDFs** — only arXiv IDs as citations. Copyright of the papers belongs to their original publishers and authors. Content is for personal study only. If you believe any content infringes your rights, please open an issue and we will remove it promptly upon verification.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) (Chinese).

## License

[MIT](LICENSE) © 2026 mutou
