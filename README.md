<p align="center">
  <img src="build/icon.png" width="112" height="112" alt="Copycraft 应用图标" />
</p>

# Copycraft 字帖工坊

<p>
  <strong>简体中文</strong> · <a href="./README.en.md">English</a>
</p>

![version](https://img.shields.io/badge/version-0.3.0-105FFF?style=flat-square)
![platforms](https://img.shields.io/badge/Web%20%7C%20macOS%20%7C%20Windows-39FF14?style=flat-square&labelColor=10141D)
![license](https://img.shields.io/badge/license-MIT-105FFF?style=flat-square)

<p>
  <a href="https://copycraft.looplooptech.com/">官网</a> ·
  <a href="https://github.com/niyongsheng/Copycraft/releases">下载</a> ·
  <a href="https://pan.baidu.com/s/13Fdi5URwlZdvJKHMmYfZIg?pwd=58f7">网盘</a>
</p>

面向小朋友练字、学校教学与家庭练习的字帖生成器，支持 **Web / macOS / Windows**，内容全部在本地生成。

https://github.com/user-attachments/assets/df6a65b1-7e85-42e2-8657-630cdba68ee2

## 功能

- **24 种字帖**：姓名、汉字、生字组词、看拼音写词语、古诗词、段落、拼音、笔画、英文、英语单词、控笔、数字、数学运算、竖式计算、脱式计算、珠心算、空白练习纸、学习时钟与笔顺查询。
- **模板库**：内置课本同步、结构规律、偏旁部首、生字组词与练习册模板，支持 `?preset=` 分享链接。
- **练习册模式**：把「结构 → 生字 → 组词 → 段落」等多张字帖合成一本，一次导出全部页面。
- **笔顺示范**：姓名逐笔推进，支持笔画完毕截断与不重复生成。
- **双格式导出**：PDF 打印/下载，Word 按高清 A4 页面图片嵌入。
- **完整定制**：字体、字号、行距、边距、八种格子、颜色与标题，设置自动记忆。
- **多语言界面**：简体中文、繁體中文、English、日本語、한국어，可在设置中即时切换，桌面端原生菜单同步更新。

## 开发与构建

```bash
npm install
npm run dev          # Web: http://localhost:5178
npm run dev:desktop  # Electron + Vite HMR
npm run test:license # 激活 / 试用单元测试
npm run build:web    # 静态站点，输出 dist/
npm run dist:mac     # macOS dmg / pkg / zip
npm run dist:win     # Windows NSIS / portable
npm run dist:win:zip # Windows 免安装 zip
npm run pack:desktop # 未打包的 .app / win-unpacked
```

## 常见问题

**macOS 提示「已损坏，无法打开」？**

桌面端为 ad-hoc 签名的未公证构建，下载后会被 Gatekeeper 隔离，并非文件损坏。

- 推荐下载 `.pkg`：安装脚本会自动清除隔离标记，装完即可打开。
- 打开 `.pkg` 被拦截时，右键 →「打开」，或到「系统设置 → 隐私与安全性」点「仍要打开」。
- 使用 `.dmg` 时，把应用拖入「应用程序」后执行：

  ```bash
  xattr -dr com.apple.quarantine "/Applications/Copycraft 字帖工坊.app"
  ```

## 联系我

- X: [@niyongsheng](https://x.com/niyongsheng)
- E‑mail: niyongsheng@Outlook.com

## 许可证

本项目基于 [MIT](./LICENSE) 协议开源，Copyright © 2026 Copycraft。

- [隐私政策](./PRIVACY.md)
- [第三方许可与署名](./THIRD_PARTY_NOTICES.md)
- [Arphic Public License（笔顺数据）](./ARPHICPL.TXT)
