---
name: copycraft-release
description: 发布 CopyCraft 新版本：统一版本号、提交、推送 main 自动部署 Pages、手动触发桌面端打包并发布 GitHub Release、验证产物
---

# 发布新版本 — CopyCraft

当用户要求「发版 / 发布新版本 / release」时执行本流程。

## 发布模型

- 版本唯一来源是 `package.json` 的 `version`。Vite 通过 `__APP_VERSION__` 注入 Web，Electron 通过 `app.getVersion()` 读取，无需改源码。
- 推送 main → `.github/workflows/build.yml` 构建 Web 并自动部署 GitHub Pages（https://copycraft.looplooptech.com，CDN 缓存最多 10 分钟）。
- 桌面端不随 commit 构建。只有手动运行 `.github/workflows/release.yml` 并填写 tag，才会打包 macOS / Windows 并创建或更新 GitHub Release。
- 客户端「检查更新」比较 GitHub 最新 Release 的 tag 与 `APP_VERSION`（`src/lib/updates.ts`），所以 tag 必须与 `package.json` 版本一致，且不能用 prerelease，否则客户端查询 `releases/latest` 看不到。
- macOS 为 ad-hoc 签名、未公证：`.pkg` 的 postinstall 会自动清除 `com.apple.quarantine`；`.dmg` 用户需手动执行 `xattr -dr com.apple.quarantine`（README 常见问题已有说明）。

## 0. 前置检查

```bash
git status --short          # 必须干净；有改动先确认是否属于本次发布
git branch --show-current   # 应为 main
git fetch origin && git status -sb   # 确认与 origin/main 同步
```

不要用 `git add .` 盲提交；版本提交只暂存版本文件。

## 1. 确定版本号

```bash
node -p "require('./package.json').version"
git tag --sort=-v:refname | head -5
gh release list --limit 5
```

- 默认在当前 `package.json` 版本上 patch +1。
- 若当前版本还没有对应的 tag / Release，也可以直接发布当前版本（先与用户确认）。
- 用户指定版本则按指定值。
- 记新版本为 `X.Y.Z`，tag 为 `vX.Y.Z`。

## 2. 更新版本号

| 文件 | 操作 |
|---|---|
| `package.json`、`package-lock.json` | `npm version X.Y.Z --no-git-tag-version` |
| `README.md` | 更新徽章 `badge/version-X.Y.Z` |

校验：

```bash
node -p "require('./package.json').version + ' / ' + require('./package-lock.json').version"
grep -n "badge/version" README.md
```

## 3. 本地校验

```bash
npm run test:license
npm run build:web
git diff --check
```

`build:web` 会执行 `tsc -b` 和 `vite build`。若本次发布包含代码改动，确保它们已在此之前单独提交并推送。

## 4. 提交并推送 main

```bash
git add package.json package-lock.json README.md
git commit -m "chore: bump version to vX.Y.Z"
git push origin main
```

这一步会触发 `build` 工作流：Web 构建 + 自动部署 Pages。

## 5. 触发桌面端打包与发布

```bash
gh workflow run release.yml --ref main -f tag=vX.Y.Z
# 预发布（客户端更新检查不会看到）：
# gh workflow run release.yml --ref main -f tag=vX.Y.Z -f prerelease=true
```

- 不要先手动 `git tag` / `git push origin vX.Y.Z`：单独推送 tag 不会触发任何工作流。tag 由 `publish` job 在全部桌面构建成功后创建，指向本次运行的 commit。
- 不填 `tag` 只打包不发布，产物留在 Actions artifacts。
- 也可以在 GitHub 页面发布一个 Release 触发同一流程，但构建失败会留下一个没有资产的 Release；推荐用上面的 dispatch 方式。
- 发布构建要求仓库 secret `COPYCRAFT_LICENSE_SECRET` 存在，否则 `Require license secret for release builds` 会失败。

## 6. 监控 CI

```bash
gh run list --workflow build.yml --limit 1
gh run list --workflow release.yml --limit 1
gh run watch <run-id> --exit-status
```

Job 顺序：

- `build`：`Web (static)` → `Deploy Pages`
- `release`：`Web (static)` → `desktop / Desktop (macos-latest)` 与 `Desktop (windows-latest)` → `Publish release assets`

`gh` 偶发网络 EOF，可用带重试的轮询：

```bash
for i in $(seq 1 60); do
  out=$(gh run view <run-id> --json status,conclusion -q '"\(.status) \(.conclusion // "")"' 2>/dev/null) || out=retry
  case "$out" in
    "completed success") echo "CI SUCCESS"; break;;
    "completed "*) echo "CI FAILED: $out"; break;;
  esac
  sleep 20
done
```

## 7. 验证发布

### Pages

```bash
gh run list --workflow build.yml --limit 1
curl -sI https://copycraft.looplooptech.com/ | grep -i last-modified
```

- 部署成功后再看 `last-modified`；CDN 有 `max-age=600`，可能延迟最多 10 分钟。
- 可对比线上 `index.html` 的资源 hash 与本地 `dist/index.html` 是否一致。

### GitHub Release

```bash
gh release view vX.Y.Z --json tagName,isDraft,isPrerelease,publishedAt,assets \
  -q '.tagName, .isDraft, .isPrerelease, .publishedAt, (.assets[].name)'
```

- `publish` job 会自动生成 Release 说明：`Download` 表格（macOS `.pkg` arm64/x64、Windows `.exe`）+ `What's Changed`（feat/fix/perf 提交）+ `Full Changelog` 链接。
- 如需更新已有 Release 的说明：`gh release edit vX.Y.Z --notes-file <file>`。

预期资产（以 `X.Y.Z` 为例）：

- macOS：`CopyCraft-X.Y.Z-mac-arm64.dmg`、`CopyCraft-X.Y.Z-mac-x64.dmg`
- macOS：`CopyCraft-X.Y.Z-mac-arm64.pkg`、`CopyCraft-X.Y.Z-mac-x64.pkg`
- macOS：`CopyCraft-X.Y.Z-mac-arm64.zip`、`CopyCraft-X.Y.Z-mac-x64.zip`
- Windows：`CopyCraft-Setup-X.Y.Z-x64.exe`、`CopyCraft-Portable-X.Y.Z-x64.exe`
- 如生成的 `*.blockmap` 文件

校验客户端更新检查能看到本次版本：

```bash
gh api repos/niyongsheng/CopyCraft/releases/latest --jq '.tag_name'
```

应输出 `vX.Y.Z`。若输出旧版本，检查是否误标为 prerelease 或 draft。

## 8. 失败处理

- **桌面构建失败**：`publish` 未执行，tag / Release 不会创建。修复后重跑失败 job：

  ```bash
  gh run rerun <run-id> --failed
  ```

  若需要改代码，从 main 修复后发布下一个 patch，不要动本次 tag。
- **Release 已创建后重跑**：`softprops/action-gh-release` 会覆盖同名资产。
- **Pages 部署失败**：`gh run view <run-id> --log-failed`；检查仓库 Pages Source 是否为「GitHub Actions」、工作流是否有 `pages: write` / `id-token: write` 权限。
- **Push 失败**：如实报告错误，不静默重试。
- 永远不要 `git push --force` tag，也不要删除后重推 tag。

## 9. 一次性准备

```bash
gh secret list                          # 需要 COPYCRAFT_LICENSE_SECRET
gh api repos/niyongsheng/CopyCraft/pages  # Source 应为 GitHub Actions，cname 为 copycraft.looplooptech.com
```

- macOS 目前无需 Apple Developer ID（`electron-builder.yml` 中 `mac.identity: "-"` 为 ad-hoc 签名）。
- 若将来要消除 Gatekeeper 的「无法验证开发者」提示，需要配置 Developer ID 证书 + notarization，并相应修改 `electron-builder.yml` 与 CI secrets。

## 10. 快速清单

- [ ] 工作区干净，main 与 origin 同步
- [ ] `package.json`、`package-lock.json`、README 徽章版本一致
- [ ] `npm run test:license`、`npm run build:web` 通过
- [ ] 版本提交已推送 main
- [ ] `build` 工作流成功，Pages 已更新
- [ ] `release` 工作流手动触发并全绿
- [ ] Release 资产齐全，tag 与版本一致
- [ ] `releases/latest` 返回 `vX.Y.Z`
