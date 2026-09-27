# 更新日志

## [v0.2.8] - 2026-09-27

### 修复 macOS 制品（v0.2.7 用户反馈无法运行）

- **通用二进制**：macOS 构建改为 `wails build -platform darwin/universal`，同时覆盖 Apple Silicon 与 Intel（此前仅 arm64，Intel 机型无法运行）
- **Ad-hoc 签名**：构建后 `codesign --force --deep --sign -` 封签整个 .app 包（无 Apple 开发者账号，首次打开仍需移除隔离属性，Release 说明已附 `xattr -dr com.apple.quarantine` 指引）

### 依赖升级（前后端）

- **Go**：wails v2.11.0 → **v2.16.0**（含 macOS 修复），golang.org/x/{crypto,net,sys,text} 同步升级；`go build -tags desktop,production` 验证通过
- **npm**（范围内全升）：next 15.5.26、react/react-dom 19.3.0、next-intl 4.14.7、tailwindcss 4.3.3、@radix-ui/*、@lobehub/icons 5.21、sonner、tailwind-merge、zustand、@types/*
- **lucide-react 0.511 → 1.48（大版本）**：v1 移除品牌图标 `Github`，三处引用（Header / Jailbreak / Trace）改用已有依赖 `@lobehub/icons/es/Github`
- **有意跳过的大版本**：next 16、TypeScript 7（Go 版 tsc，风险大）、gpt-tokenizer 4（会改变 Token 计数行为，影响 Tokenade 工具一致性）、vitest 5 / eslint 10（当前未使用）
- CI：node 20 → 22，wails CLI 同步 v2.16.0

## [v0.2.7] - 2026-09-27

### 吸收 icesky 缺失功能（21 → 30 个工具）

从 [icesky](https://github.com/spindriftpapilio/icesky)（冰霄，提示词注入综合工具）对比吸收本项目缺失的 **9 个工具**。对比结论：转换器集合两边一致（222 = 222），ASCII 走私 / Emoji 隐写 / 多轮样本构造等已有等价实现，缺口集中在多模态文件注入与参考库：

**文件注入（5 个）**

- **Rich Text Inject（富文本注入）** — 5 种隐藏手法（隐藏节点 / HTML 注释 / data-* 属性 / `<details>` 折叠 / 零尺寸图层）生成 HTML / Markdown / 纯文本样本；上传 HTML/MD/TXT 分析隐藏通道推断（DOMParser），iframe 沙箱预览 + "页面所见 vs 预期读取" 对比
- **Image Inject（图像注入）** — 文本渲染成文档图 / 原图叠加 / 混合三种模式；本地注入文本生成器（5 目标 × 4 对象 × 5 包装 × 4 语气 × 3 语言）、混淆字符替换、旋转 / 抖动 / 模糊 / 噪点 / 干扰线扰动（确定性种子）、上传魔数校验、差异对比引擎
- **Audio Inject（音频注入）** — 5 种注入模式（底噪隐层 / 片尾附加 / 双声道分离 / 字幕错配 / 元数据夹带）；文本→音调渲染、混音 DSP、16-bit WAV 编码器（含 RIFF LIST/INFO 元数据）、WebVTT 字幕、波形 + 频谱可视化、上传解码混注
- **DOCX Inject（Word 注入）** — 隐藏文字（vanish run）/ 批注 / 页眉页脚 / 元数据 / 综合 5 预设 × 5 注入位；自研零依赖 ZIP 读写（原生 `DecompressionStream` 解压、STORE 写入、原条目透传），OOXML 全套构建器；上传 DOCX 再注入（round-trip 验证）
- **PDF Inject（PDF 注入）** — 白字 / ToUnicode 错配 / 透明度 / 渲染模式 / 追加 / 前插等多通道注入；手写 PDF 对象级生成器（字体嵌入 / CMap / 纸纹背景）、上传 PDF 解析与结构检测、提取结果对照

**参考库与生成器（3 个）**

- **Injection Gen（注入生成器）** — 本地注入提示词生成：1185 条内置模板（中文 1125 / 英文 60，35 类别）、种子化 PRNG 批量生成（与 icesky 同种子逐字节一致）、txt/JSON/JSONL 导出、"送入文本变换" 联动
- **Jailbreak Library（越狱提示词库）** — 61 条编码模型系统提示词与仓库资料（Codex / Claude Code / Cursor / DSH / Grok Build），数据逐字节保真；搜索 / 模型筛选 / 编辑（localStorage 草稿）/ 复制 / 导出 / 送入文本变换
- **Injection Taxonomy（注入技术分类法）** — 116 条提示注入技术参考（攻击意图 / 技术手法 / 规避方式 / 输入面四分类，含 CrowdStrike 2026-07 研究更新），目录导航 + 搜索 + 折叠分组 + "带入样本构造" 联动

**文本工具（1 个）**

- **Style Craft（古风写作）** — 纯本地古风改写引擎：文言体 / 诗歌体两模式，3 档古意浓度，词汇替换 + 意象注入 + 保护词锁定（自动识别日期 / 地名 / 机构名 / 数字），三候选 + 保真 / 古意指标

### 基础设施

- 新增 `useHandoffStore`（跨工具文本交接）：注入生成器 / 越狱库 / 分类法 → TransformsTool 输入预填；分类法 → MultiTurnTool 追加样本消息
- `lib/injection/` 新增 6 个框架无关注入库（richtext / image / audio / docx / docxZip / pdf / generator），界面文案全部 i18n machine key 化，零新增 npm 依赖
- 全部 9 个工具中英双语完整（key 覆盖审计通过），注册进 TOOL_CONFIGS / ToolPanel / TabBar（图标 + 快捷键）
- 验证：`tsc --noEmit` 全绿；docx / image / injectiongen / jailbreak 附带 Node 运行时冒烟或逐字节等价测试

## [v0.2.6] - 2026-09-23

### 上游转换器大版本移植（159 → 222 种）

从 upstream (`elder-plinius/P4RS3LT0NGV3`) 移植 **56 个新转换器** 与 2 个转换器增强，转换总数从 166 增至 **222**：

- **密码（Ciphers）+13** — Acéré、ADFGVX、AMSCO、Book、Codons（遗传密码子）、Double Transposition、Fractionated Morse、Keyword Shift、Monoalphabetic、Multiplicative、Route、Trithemius、Vernam
- **隐藏术（Concealment，新分类）+5** — Acrostic（藏头）、Cardan Grille、Homoglyph、Null Cipher、Trevanion
- **编码（Encodings）+5** — Bibi-binary、Decabit、Manchester、Metaphone、Shadoks
- **格式化（Formatting）+8** — Group Letters、Leading Zeros、List Deduplicate、Shuffled Letters、Typoglycemia、Word Letter Add/Change/Remove
- **符号文字（Symbol，新分类）+22** — 炼金术、巴比伦/埃及/玛雅数字、天体/以诺/玛拉基姆/底比斯/月相/渡河/玫瑰十字字母、跳舞小人、荷鲁斯之眼、弗里德里西窗格、玛丽女王、元素周期表、七段数码管、标准银河（Minecraft 附魔台）、圣殿骑士、多米诺、后弗萨克
- **技术（Technical）+4** — DTMF、Navajo Code、Phone Keypad、T9 Multi-tap
- **增强** — Bubble 新增圈数字 ⓪–⑨ 并支持解码；Upside Down 新增 180° 旋转 / 垂直翻转双模式并支持解码
- **修复** — 移植上游 PR #28：Morse 编码返回空串（`func` 第二参数误当布尔 `decode`，options 对象恒为真值导致 encode 走解码分支）；preview 占位符 `[base32]` → `[morse]`

### 同步更新

- `src/transformers/`（CLI/Node 桥）与 `wails/frontend/src/lib/transformers/`（桌面端）双端同步
- `migrate-transformers.ts` 修复源路径（仓库内相对路径）、补充 concealment/signwriting/symbol 分类、生成 index.ts 时自动注入 `setTransformRegistry`
- TransformsTool 新增 concealment / symbol 分类配色与图例
- README（中/英）转换目录与计数同步至 222

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
