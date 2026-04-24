# 更新日志

## [v0.2.4] - 2026-04-24

### 新增转换分类

- **SignWriting（手语书写）** — 基于 Unicode ISWA 2010（Sutton SignWriting，U+1D800-1DAFF）标准，包含 6 种手语与视觉编码转换器（参考 [upstream PR #23](https://github.com/elder-plinius/P4RS3LT0NGV3/pull/23)）：
  - **ASL SignWriting** — 美国手语拼写到 ISWA 字形映射，支持水平/垂直布局
  - **IPA Lipreading** — IPA 音标到 ISWA 唇读口型（head/face symbols）映射
  - **JSL SignWriting** — 日本手语 SignWriting 映射
  - **Libras SignWriting** — 巴西手语（Libras）SignWriting 映射
  - **Morse Blink** — 摩尔斯电码 ↔ ISWA 眨眼符号（dot = brief close, dash = tight press）
  - **Tactile SignWriting** — 聋盲触觉拼写的 ISWA 双手层近似表示

### 编码修复

- **Baudot Code (ITA2)** — 编码输出由不可见的控制字符改为 5 位二进制字符串（如 `10101 00010`），可直接复制粘贴并反向解码
- **EBCDIC** — 编码输出由不可见的控制字符改为十六进制字节（如 `88 85 93 93 96`），可直接复制粘贴并反向解码
- **YEnc** — 编码输出由不可见的控制字符改为十六进制字节（如 `72 8F 96 96 99`），可直接复制粘贴并反向解码

### UI 改进

- 新增 SignWriting 分类配色（amber 色系）
- 转换预览和输出区域对 SignWriting 字形使用 `Noto Sans SignWriting` 专用字体渲染
- 预加载 SignWriting 字体（`font-display: swap`，避免 FOIT）
- SignWriting 输出区域增大行高（line-height: 2）与字间距（letter-spacing: 0.1em），适配 ISWA 二维字形布局需求

### 构建与发布

- Release 工作流移除 Linux 构建（仅保留 Windows + macOS）

### 文档

- 更新 `README.md`（原 `README_zh.md`）：Baudot / EBCDIC / YEnc 输出格式说明及修复记录；设为 GitHub 默认展示文档

## [v0.2.3] - 2026-04-22

### 新增工具

- **Guardrails Tester（安全护栏测试）** — 系统化测试 LLM 安全边界，支持多类别批量测试与报告导出。
- **Mutator Chain（变换链）** — 串联多种 prompt 变换（字符打乱、随机丢弃、改写、摘要等）并将结果发送至 LLM。
- **Multi-Turn Attack（多轮攻击）** — 交互式多轮对话攻击模拟器，支持手动/自动策略。
- **Injection Detector（注入检测）** — 基于 LLM 分析与规则引擎的 prompt 注入检测。
- **Benchmark（基准测试）** — LLM 基准测试运行器，含数据集管理、统计计算与结果展示。
- **Refinement（提示词精炼）** — 迭代式 prompt 精炼工具，优化提示词质量。

### 新增库模块

- `lib/benchmark/` — 数据集、运行器、统计与类型定义
- `lib/fuzzer/attacks/advanced/actor_attack` — 高级角色扮演攻击策略
- `lib/fuzzer/attacks/simple/history_framing` — 历史框架攻击
- `lib/fuzzer/classifiers/` — 委员会投票、不赞同检测、危害评分、明显负面 四种分类器
- `lib/fuzzer/datasets/persuasion_taxonomy.json` — 说服力分类数据集
- `lib/guardrails/` — 安全护栏测试框架（分类、运行器、基准数据、类型）
- `lib/injection/` — 注入检测引擎（LLM 检测器 + 规则引擎 + 类型）
- `lib/mutators/` — 5 种变换器：字符打乱、随机丢弃、改写、摘要、可能有害

### UI 改进

- **ModelConfigPanel** — 新增共享模型配置面板，统一所有 LLM 工具的 Provider/Model 选择
- **TabBar** — 样式微调
- **Header** — 清理冗余元素
- **Anti-Classifier** — 完整 i18n 支持

### 国际化

- 精简语言支持：`en, zh, ja, es, fr, de` → **`en, zh`**
- 新增 Guardrails / Mutator / Multi-Turn / Injection / Benchmark / Refinement 的中英文翻译
- PromptCraft i18n 完善

### 其他

- 更新应用图标（appicon.png, icon.ico）
- 69 个文件变更，+3,395 / −342 行
