# CLAUDE.md

本文件为 Claude Code 在此仓库工作时的项目指南。

## 项目概述

[elder-plinius/P4RS3LT0NGV3](https://github.com/elder-plinius/P4RS3LT0NGV3) 的个人 fork（`upstream`），面向 AI 安全红队研究的文本转换 / 提示注入测试工具箱。**活跃开发在 wails 桌面应用**；根目录的 web 版（`src/` + `dist/`）为上游遗留，仅转换器双端同步时触及。

- 分支：`dev-din4e`（开发）→ `main-din4e`（PR 目标）
- 远端：`origin` = din4e/P4RS3LT0NGV3，`upstream` = elder-plinius/P4RS3LT0NGV3

## 目录结构

```
wails/                  # 桌面应用（主战场）
├── app.go              # Go 后端：剪贴板/文件对话框/Chat API 桥（wails bindings）
├── wails.json          # 版本号在此
└── frontend/           # Next.js 15 静态导出 + React 19
    └── src/
        ├── components/tools/   # 每工具一个 <Name>Tool.tsx，export default Tool()
        ├── lib/
        │   ├── transformers/   # 222 个转换器（与根 src/transformers 双端同步）
        │   ├── injection/      # 多模态注入样本生成（richtext/image/audio/docx/pdf/generator）
        │   ├── data/           # 参考库数据（promptInjectionTaxonomy、jailbreakLibrary）
        │   ├── core/ services/ trace/ fuzzer/ guardrails/
        │   └── stylecraft/     # 古风改写引擎
        ├── stores/             # zustand：useAppStore（工具表 + tab）、useHandoffStore（跨工具文本交接）
        └── messages/{en,zh}.json  # next-intl，所有界面文案
```

## 新增一个工具（4 处接线 + 审计）

1. `stores/useAppStore.ts` → `TOOL_CONFIGS`（id/nameKey/icon/shortcut/order；单字母快捷键近乎用尽，空串合法，TabBar 已兼容）
2. `components/layout/ToolPanel.tsx` → `TOOL_COMPONENT_MAP`（lazy import）
3. `components/layout/TabBar.tsx` → `ICON_MAP` + lucide-react import
4. `messages/en.json` + `zh.json` → `tools.<id>` 名称 + `<id>` 命名空间

约定：
- 纯逻辑进 `lib/`（框架无关、带类型；界面文案用 i18n machine key，组件里解析）
- `lib/injection/` **零 npm 依赖**——纯 TS + 浏览器 API（canvas/WebAudio/DOMParser/手写 ZIP/PDF 对象）；DOCX 用原生 `DecompressionStream`，PDF 的上传合并/预览/OCR 例外地走 CDN 懒加载（离线降级）
- 提交信息：`type(wails): 中文描述`；移植外部项目时正文附原仓库地址（如 icesky）
- 改完跑 i18n key 覆盖审计思路：组件里 `t('key')` 字面量 + 模板 key 展开，en/zh 必须零缺失

## 验证门槛（重要）

```powershell
cd wails/frontend
npx tsc --noEmit        # 这是唯一本地门槛，必须全绿
```

- **不要在本地跑 `next build` / `wails build`**：本机杀软（native AV）会让 next build 崩溃，历史已知问题；完整构建交给 CI
- Go 后端改动可用 `go build -tags desktop,production ./...`（wails/ 下）验证
- 端口 3000 被 Windows 保留（EACCES）；dev 用 package.json 里的 8080

## 发布流程

1. 版本三处：`wails/wails.json` + `wails/frontend/package.json` + `CHANGELOG.md`（中文条目，格式见现有内容）
2. commit → `git tag -a vX.Y.Z -m "..."`（annotated）→ push 分支 + tag
3. tag 推送自动触发 `.github/workflows/release-on-tag.yml`：Windows zip + macOS universal tar.gz，创建 Release
   - macOS：`wails build -platform darwin/universal` + ad-hoc `codesign`；无 Apple 开发者账号，Release 说明已附 `xattr -dr com.apple.quarantine` 指引
   - workflow 里 wails CLI 版本必须与 `wails/go.mod` 的 wails 版本一致
   - CI 踩坑记录：Go ≤1.23 编译的二进制缺 LC_UUID 会被 macOS 26 dyld 拒绝（用 ≥1.24）；macOS 打包路径必须相对仓库根（`-C wails/build/bin`，曾写到仓库外被静默吞掉）
4. 制品验证：下载 tar.gz 解包，fat 头应含 x86_64 + arm64 双架构

## 环境备忘

- git 对 github.com 配了 `http.https://github.com.proxy=127.0.0.1:7890`（Clash），代理常不开且直连间歇中断：git 操作一律加 `-c http.https://github.com.proxy=`，失败稍后重试；`gh`/`curl` 通常不受影响
- `wails/frontend/tsconfig.tsbuildinfo` 是被跟踪的构建缓存，tsc 跑完会变脏——提交前 `git checkout --` 恢复，别把它带进 diff
- `tmp/` 为分析用克隆与中间产物（icesky 移植时的 beautify 副本、制品校验等），不入库
