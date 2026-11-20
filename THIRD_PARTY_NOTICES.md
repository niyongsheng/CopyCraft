# 第三方许可与署名

Copycraft 字帖工坊（以下简称“本应用”）包含或使用以下第三方软件、数据和素材。各项目的版权归其作者所有。

## 项目许可

本应用自身代码基于 MIT License 发布，详见 [LICENSE](./LICENSE)。

## 笔顺数据

- 项目：[hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) / [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)
- 许可：Arphic Public License
- 版权：Copyright (C) 1999 Arphic Technology Co., Ltd.
- 完整许可证：[ARPHICPL.TXT](./ARPHICPL.TXT)

本应用的笔顺查询和姓名字帖会从 jsDelivr / unpkg CDN 加载 `hanzi-writer-data@2.0.1`，并在界面或导出页中渲染派生笔画图形。使用或再分发相关数据时，请遵守 Arphic Public License 的署名、许可证保留和修改公开要求。

## 运行时依赖

| 项目 | 许可 |
|---|---|
| [@aptabase/electron](https://github.com/aptabase/aptabase-electron) | MIT |
| [@aptabase/web](https://github.com/aptabase/aptabase-js) | MIT |
| [docx](https://github.com/dolanmiu/docx) | MIT |
| [hanzi-writer](https://github.com/chanind/hanzi-writer) | MIT |
| [html2canvas](https://github.com/niklasvh/html2canvas) | MIT |
| [jsPDF](https://github.com/parallax/jsPDF) | MIT |
| [lucide-react](https://github.com/lucide-icons/lucide) | ISC |
| [pinyin-pro](https://github.com/zh-lx/pinyin-pro) | MIT |
| [React](https://github.com/facebook/react) | MIT |
| [React DOM](https://github.com/facebook/react) | MIT |
| [Zustand](https://github.com/pmndrs/zustand) | MIT |

## 桌面运行时

本应用使用 [Electron](https://www.electronjs.org/)（MIT）和 Chromium（BSD 等第三方许可）。Electron 打包产物中的 `LICENSES.chromium.html`、`LICENSE.electron.txt` 等文件应随应用一同分发；请勿删除。

## 开发依赖

构建工具链包括 Vite、TypeScript、electron-builder 等，其许可分别为 MIT、Apache-2.0 等。开发依赖不会直接进入最终用户界面，但构建和分发源代码时应保留其许可声明。

## 字体

本应用不打包字体文件，界面使用操作系统提供的字体（如 Kaiti SC、STKaiti、PingFang SC、Bradley Hand 等）。系统字体的使用受操作系统许可约束，本应用不再分发字体软件本身。

## 联系

如果你认为本应用遗漏了某项署名或许可，请联系：niyongsheng@Outlook.com。
