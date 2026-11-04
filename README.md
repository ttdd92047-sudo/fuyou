# 蜉蝣十洲志 · 项目索引

长篇小说设定体系与配套网页。锚线：仇远《奉寄田上人》「愧我莫如霜上鹭，霎时飞去便飞还」；主题：社会偏见导致的交换困境。

## 目录说明

```
设定集/                         世界观与人物设定的正稿
  蜉蝣十洲志·MASTER NOVEL BIBLE V3.0.docx    主设定集（Word，可直接编辑）
  蜉蝣十洲志·MASTER NOVEL BIBLE V3.0.md      同一内容的 Markdown 源（改动先改这里）
  蜉蝣十洲志·MASTER NOVEL BIBLE V3.0.md.bak  上一版备份
  蜉蝣十洲志·设定集.docx / .md               设定集精简版
  蜉蝣十洲志·补编一.docx / .md               补编第一辑
网站/                           世界观设定集静态站
  index.html                    入口，双击即可打开
  assets/data.js                站点数据（从 MASTER BIBLE 抽取生成）
  assets/app.js / style.css     交互与视觉
  assets/img1.png / img2.png    插图
蜉蝣十洲志·人物关系脑图.html     独立的人物关系图，单文件
构建工具/                       生成网站与 docx 的脚本
  tools/md2docx.py              Markdown → Word
  tools/build_site_data.py      Markdown → 网站 data.js
  tools/prep_extract.py         设定稿抽取预处理
  tools/qa_shots.py             网页截图质检
  tools/backup.py               项目打包备份
  site-src/                     网站生成用的中间稿与插图源
工具/                          一键脚本（双击即可）
  发布到 GitHub.bat             首次发布：写入网址并生成 dist
  ③ 更新并生成发布包.bat         改完设定后重建网站数据 + 重新打包
build_dist.py                   生成公网发布包 dist/（SEO、sitemap、文字版）
site-config.json                记住你的网站地址（首次发布后自动生成）
dist/                           上传到 GitHub 的那一份（由 build_dist.py 生成）
截图/                           网页与脑图的验收截图
```

## 常用操作

**改设定**：先改 `设定集/*.md`，再重新生成 Word 与网站数据。

```bash
cd "D:/workbuddy/projects/02-蜉蝣十洲志"

# Markdown → Word
python 构建工具/tools/md2docx.py "设定集/蜉蝣十洲志·MASTER NOVEL BIBLE V3.0.md"

# Markdown → 网站数据（重新生成 网站/assets/data.js）
python 构建工具/tools/build_site_data.py
```

**看网站**：直接双击 `网站/index.html`（离线可用，无外部依赖）。

**看人物关系**：双击 `蜉蝣十洲志·人物关系脑图.html`。

**更新公网那一份**：双击 `工具/③ 更新并生成发布包.bat`，然后把 `dist/` 里的内容重新上传到 GitHub。

## 发布到 GitHub Pages

首次：双击 `工具/发布到 GitHub.bat`，按提示填 GitHub 用户名（仓库名默认 `fuyou`），
然后建仓库、把 `dist/` 里的**内容**拖上去、在 Settings → Pages 选 `main` / `/ (root)`。

地址形如 `https://用户名.github.io/fuyou/`。详细步骤见 `GitHub-Pages操作手册.md`。

> 发布包与源码的区别：`dist/` 是给公众看的那一份（约 1.1 MB）；`设定集/`、`构建工具/`、
> `截图/` 属于本机资料，不会进 dist，也不会上传。

## 注意

- 所有脚本已改为相对路径定位（按 `__file__` 推算项目根），整个项目文件夹搬走也不会失效。
- `网站/` 本身已是纯静态、无外部依赖、无绝对路径；`build_dist.py` 只做三件事：复制内容、
  注入 SEO 元数据、生成 `about.html` 文字版——因为正文是 JS 渲染的，爬虫读不到，这个页面负责被搜到。
- 设定集含全书结构
