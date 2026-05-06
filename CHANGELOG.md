# 更新日志

## [v0.2.5] - 2026-04-27

### 多提供商架构重构

- 支持同时配置多个 AI 提供商，预设覆盖 **18+ 提供商**：
  - **本地** — Ollama (localhost:11434)、LM Studio (localhost:1234)，无需 API Key
  - **国际** — OpenRouter、OpenAI、Anthropic、Google AI
  - **国内** — DeepSeek、Qwen、Moonshot、Zhipu、MiniMax、Yi、Baichuan、Baidu、Spark、Tencent、SiliconFlow、ModelScope
  - **国内（国际版）** — Zhipu GLM、MiniMax、Kimi
- 每个工具支持独立的提供商/模型覆盖
- 模型列表自动发现与 1 小时缓存
- 连接测试功能
- LobeHub Icons 集成
- 从单提供商（仅 OpenRouter）迁移到多提供商，Zustand `persist` middleware 自动迁移旧版配置
- Wails Go 后端代理本地提供商请求，避免 CORS

### Latin 词素分析系统

- 新增 Latin 词根敏感用语检测与中和模块（`lib/data/latinAffixPolicies.ts` + `lib/utils/lexemeAnalysis.ts`）
- 5 条检测策略：`-cide` 后缀、`-cidal` 后缀、根除类动词 (eradicate/exterminate/annihilate/obliterate)、压制类用语 (neutralize/incapacitate/suppress)、致命类用语 (lethal/fatal/terminal/mortal)
- 自动提取根词素并通过 `DOMAIN_ALIASES` 解析语义域
- 一键中和重写，保持原始大小写模式
- 共享 `LexemeAnalysisPanel` 组件集成至 AntiClassifier / PromptCraft / Bijection

### Emoji 隐写增强

- 6 个可折叠 Emoji 分类面板（Animals, Nature, Objects, Faces & People, Symbols & Signs, Food & Drink），约 **270 个 Emoji**
- 自定义 Emoji 输入，通过 `Intl.Segmenter` 正确提取字素簇
- 高级隐写选项面板：初始呈现方式、位序 (MSB/LSB)、位选择符、位间/尾部零宽字符
- `StegOptions` 接口扩展至完整 7 字段
- Core carriers 扩充至 **16 个** 命名载体

### 护栏测试增强

- 导出报告支持 JSON / Markdown / HTML 多格式，HTML 含样式表格
- 自定义预料：手动添加或从 `.txt` / `.csv` 导入，持久化至 localStorage
- 统一原生保存对话框（通过 Wails Go 后端调用系统原生文件对话框）

### ProviderModal 分组布局

- 按 Local / Global / 国内 / 国内（国际版）四组分类展示
- 移除 12 个提供商显示上限，显示全部
- 国内分组增加滚动区域 (max-h-40)

### 国际化

- 隐写选项、提供商分组、Decode 面板全部中英双语翻译
- en.json / zh.json 各新增 20+ 翻译条目

### 修复

- SteganographyTool 移除类内重复 Emoji（🦜×2, 🐊×2, 🔮×3, 🧿×2, 💠×2），React key 改用 `category-index`
- SplitterTool 添加 `?? ''` 修复 TS2322/TS2345 类型错误
- PromptCraftTool 修复 `Record<string, unknown>` → `Record<string, string | number | Date>` 兼容 next-intl

### 重构

- 移除 8 个工具组件的 `@ts-nocheck` 指令
- 移除 OpenRouter 强依赖说明

### 文档

- README_zh 技术条目中英双语
- 新增 `docs/TOOLS.md` 全工具技术文档（19 个工具 + 共享模块）

---

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
