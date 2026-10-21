<p align="center">
  <img src="build/icon.png" width="112" height="112" alt="Copycraft 应用图标" />
</p>

# Copycraft 字帖工坊

![version](https://img.shields.io/badge/version-0.2.0-105FFF?style=flat-square)
![platforms](https://img.shields.io/badge/Web%20%7C%20macOS%20%7C%20Windows-39FF14?style=flat-square&labelColor=10141D)
![React](https://img.shields.io/badge/React-19-105FFF?style=flat-square&logo=react&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-44-39FF14?style=flat-square&labelColor=10141D&logo=electron&logoColor=white)
![license](https://img.shields.io/badge/license-MIT-105FFF?style=flat-square)

一款面向练字、教学与家庭练习的字帖生成器，支持 **Web / macOS / Windows** 三端，全部内容在本地生成。

## 亮点

- **17 种字帖**：姓名、汉字、段落、拼音、笔画、英文、控笔、数字、数学运算、学习时钟与笔顺查询。
- **姓名优先 + 笔顺示范**：姓名字帖置于首位，支持逐笔推进展示、笔画完毕截断与不重复生成开关。
- **双格式导出**：PDF 矢量打印输出；Word（.docx）按高清 A4 页面图片嵌入，版式一致。
- **易用界面**：分类侧栏、可折叠设置面板、实时 A4 预览、一键换一组、快捷键与本地设置记忆。
- **完整定制**：字体、字号、行距、页边距、八种格子、三种主色与标题均可调。
- **跨平台**：同一套 React 代码运行于浏览器和 Electron，桌面端支持原生窗口与原生 PDF 保存。

## 快速开始

```bash
npm install
npm run dev          # Web: http://localhost:5178
npm run dev:desktop  # Electron + Vite HMR
```

## 构建与部署

```bash
npm run build:web        # 输出 dist/，可部署到任意静态托管
npm run dist:mac         # release/*.dmg + *.zip
npm run dist:win         # Windows NSIS / portable（Windows 或 CI）
npm run dist:win:zip     # Windows 免安装 zip
npm run pack:desktop     # 未打包的 .app / win-unpacked
```

### 自动发版

发布一个 GitHub Release（tag 形如 `v0.3.0`）后，`.github/workflows/release.yml` 会自动：

- 构建 macOS（dmg / zip）与 Windows（NSIS / portable）安装包，并附加到该 Release
- 构建 Web 版并部署到 GitHub Pages

> 首次使用 Pages 前，请在仓库 **Settings → Pages** 将 Source 设为 **GitHub Actions**。
> 部署地址：<https://niyongsheng.github.io/Copycraft/>

## 技术栈

React 19 · TypeScript · Vite · Zustand · Electron · electron-builder · pinyin-pro · hanzi-writer · docx · html2canvas
