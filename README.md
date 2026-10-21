<p align="center">
  <img src="build/icon.png" width="112" height="112" alt="Copycraft 应用图标" />
</p>

# Copycraft 字帖工坊

![version](https://img.shields.io/badge/version-0.3.0-105FFF?style=flat-square)
![platforms](https://img.shields.io/badge/Web%20%7C%20macOS%20%7C%20Windows-39FF14?style=flat-square&labelColor=10141D)
![license](https://img.shields.io/badge/license-MIT-105FFF?style=flat-square)

面向练字、教学与家庭练习的字帖生成器，支持 **Web / macOS / Windows**，内容全部在本地生成。

## 功能

- **17 种字帖**：姓名、汉字、段落、拼音、笔画、英文、控笔、数字、数学运算、学习时钟与笔顺查询。
- **笔顺示范**：姓名逐笔推进，支持笔画完毕截断与不重复生成。
- **双格式导出**：PDF 矢量打印，Word 按高清 A4 页面图片嵌入。
- **完整定制**：字体、字号、行距、边距、八种格子、颜色与标题，设置自动记忆。
- **匿名使用统计**：仅上报功能使用与导出结果，可在设置中关闭，不采集字帖内容与个人信息。

## 激活与试用

桌面版（macOS / Windows）内置离线激活，网页版不受限制。

- 未激活用户可免费试用 **14 天** 或 **30 次成功导出**，任一条件用尽即需激活。
- 在「设置 → 激活」复制机器指纹，发给开发者换取激活码；激活后永久有效、导出次数不限。
- 激活码仅对生成时使用的机器指纹有效，全程离线校验，无需联网。
- 试用次数与开始时间会写入系统级影子位置并签名，重装应用不会重置试用。

供应商生成激活码：

```bash
npm run license:gen -- XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
npm run license:fp   # 打印本机指纹并生成激活码（自测）
```

算法：

```
指纹   = Crockford32( SHA-256(machine_uid) )[前 25 字符]
激活码 = Crockford32( HMAC-SHA256(产品密钥, "copycraft:lic:v1:" ∥ 指纹) )[前 25 字符]
```

`electron/license-core.cjs` 中的 `PRODUCT_SECRET` 发布前请替换为私有值；发布后不要修改，否则已发出的激活码会全部失效。内嵌密钥是离线授权的已知局限（威慑而非 DRM）。

## 隐私与统计

桌面版使用 [Aptabase](https://aptabase.com) 上报匿名使用事件（App Key `A-US-3310853956`）。

- 仅包含事件名、应用版本、系统平台、导出格式与结果等，不包含字帖内容、姓名、机器指纹或激活码。
- 可在「设置 → 隐私」随时关闭，关闭后不再发送任何事件。
- 开发运行（未打包版本）不会上报；网页版不启用统计。

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