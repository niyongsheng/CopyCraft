<p align="center">
  <img src="build/icon.png" width="112" height="112" alt="Copycraft 应用图标" />
</p>

# Copycraft 字帖工坊

![version](https://img.shields.io/badge/version-0.3.0-105FFF?style=flat-square)
![platforms](https://img.shields.io/badge/Web%20%7C%20macOS%20%7C%20Windows-39FF14?style=flat-square&labelColor=10141D)
![license](https://img.shields.io/badge/license-MIT-105FFF?style=flat-square)

面向小朋友练字、学校教学与家庭练习的字帖生成器，支持 **Web / macOS / Windows**，内容全部在本地生成。

## 功能

- **18 种字帖**：姓名、汉字、生字组词、段落、拼音、笔画、英文、控笔、数字、数学运算、学习时钟与笔顺查询。
- **模板库**：内置课本同步、结构规律、偏旁部首、生字组词与练习册模板，支持 `?preset=` 分享链接。
- **练习册模式**：把「结构 → 生字 → 组词 → 段落」等多张字帖合成一本，一次导出全部页面。
- **笔顺示范**：姓名逐笔推进，支持笔画完毕截断与不重复生成。
- **双格式导出**：PDF 矢量打印，Word 按高清 A4 页面图片嵌入。
- **完整定制**：字体、字号、行距、边距、八种格子、颜色与标题，设置自动记忆。

模板库中的课本内容为示例数据，套用后可在右侧继续修改；正式使用前请按所用教材版本核对生字与词语。分享链接形如 `?preset=<模板 ID>`，只包含模板标识，不包含用户内容。

## 开发与构建

```bash
npm install
npm run dev          # Web: http://localhost:5178
npm run dev:desktop  # Electron + Vite HMR
npm run test:license # 激活 / 试用单元测试
npm run build:web    # 静态站点，输出 dist/
npm run dist:mac     # macOS dmg / zip
npm run dist:win     # Windows NSIS / portable
npm run dist:win:zip # Windows 免安装 zip
npm run pack:desktop # 未打包的 .app / win-unpacked
```

## 许可证

本项目基于 [MIT](./LICENSE) 协议开源，Copyright © 2026 Copycraft。
