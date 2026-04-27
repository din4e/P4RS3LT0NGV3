# P4RS3LT0NGV3 工具技术文档

> 版本：v0.2.5 | 更新日期：2026-04-27

本文档描述 Wails 桌面应用中所有工具的技术实现、核心能力和使用场景。

---

## 目录

- [文本转换类](#文本转换类)
  - [TransformsTool — 变换工作台](#transformstool--变换工作台)
  - [DecoderTool — 通用解码器](#decodertool--通用解码器)
  - [SplitterTool — 文本分割器](#splittertool--文本分割器)
  - [GibberishTool — 乱语生成器](#gibberishtool--乱语生成器)
  - [TokenizerTool — 分词可视化](#tokenizer-tool--分词可视化)
  - [SteganographyTool — 隐写工具](#steganographytool--隐写工具)
  - [TokenadeTool — Token 炸弹](#tokenadetool--token-炸弹)
- [提示词工程类](#提示词工程类)
  - [PromptCraftTool — 提示词工坊](#promptcrafttool--提示词工坊)
  - [AntiClassifierTool — 反分类器](#anticlassifiertool--反分类器)
  - [BijectionTool — 双射映射](#bijectiontool--双射映射)
  - [TranslateTool — AI 翻译](#translatetool--ai-翻译)
- [安全测试类](#安全测试类)
  - [FuzzerTool — 模糊测试](#fuzzertool--模糊测试)
  - [GuardrailsTool — 护栏测试](#guardrailstool--护栏测试)
  - [InjectionDetectorTool — 注入检测](#injectiondetectortool--注入检测)
  - [BenchmarkTool — 基准测试](#benchmarktool--基准测试)
  - [MultiTurnTool — 多轮攻击](#multiturntool--多轮攻击)
  - [MutatorTool — 变异器链](#mutatortool--变异器链)
  - [RefinementTool — 响应精炼](#refinementtool--响应精炼)
  - [CCBosTool — 文言文越狱](#ccbostool--文言文越狱)
- [共享模块](#共享模块)
  - [词素分析系统](#词素分析系统)
  - [隐写引擎](#隐写引擎)
  - [通用解码引擎](#通用解码引擎)

---

## 文本转换类

### TransformsTool — 变换工作台

**文件：** `src/components/tools/TransformsTool.tsx`

文本变换的核心工作台，提供分类浏览、实时预览、收藏和历史记录。

**变换分类：**

| 分类 | 说明 | 示例 |
|------|------|------|
| ancient | 古代文字 | Runic、Ogham、Linear B |
| case | 大小写转换 | upper、lower、title、spongebob |
| cipher | 密码学 | Caesar、ROT13、Vigenère、Atbash |
| encoding | 编码 | Base64、URL、HTML Entity、Morse |
| fantasy | 奇幻文字 | Elvish (Sindarin)、Dovahzul、Aurebesh |
| format | 格式化 | Reverse、Sort Lines、Zalgo |
| signwriting | 书写符号 | ISWA 2010 SignWriting |
| special | 特殊 | Randomizer |
| technical | 技术编码 | Unicode Escape、Hex、Binary |
| unicode | Unicode 变换 | Fullwidth、Strikethrough、Small Caps |
| visual | 视觉文本 | Regional Indicator (国旗)、Math Sans |

**核心功能：**
- 实时预览（取输入前 10 字符做变换预览）
- 收藏系统（star 切换，持久化至 localStorage）
- 最近使用（显示最近 5 个变换）
- 搜索（Ctrl+K 快捷键聚焦搜索框）
- 可配置选项弹窗（checkbox / select / text / number）
- 分类折叠/展开

**相关模块：**
- `src/lib/transformers.ts` — 变换注册表 `allTransforms`、`transformsByCategory`

---

### DecoderTool — 通用解码器

**文件：** `src/components/tools/DecoderTool.tsx`

自动检测并逆向文本变换，支持语言检测和 AI 翻译。

**解码策略（优先级从高到低）：**
1. **检测器驱动** — 调用变换的 `detector()` 函数匹配，再用 `reverse()` 解码
2. **Emoji 隐写解码** — 检测并解码 Variation Selector 隐写
3. **活跃变换逆变换** — 当前选中的变换的 `reverse()` 方法
4. **盲逆变换** — 遍历所有具有 `reverse` 方法的变换逐一尝试

**语言检测：**
- 基于 Unicode 脚本范围（阿拉伯、中日韩、西里尔等）
- 拉丁语系通过词频启发式（西班牙语、法语、德语等）

**AI 翻译：**
- 检测到非英语时，一键调用 OpenRouter (Gemma 3 27B) 翻译为英语
- 需要配置 API 密钥

**相关模块：**
- `src/lib/core/decoder.ts` — `universalDecode()`

---

### SplitterTool — 文本分割器

**文件：** `src/components/tools/SplitterTool.tsx`

将文本按多种策略分割为可复制的块，支持后置变换和封装。

**6 种分割模式：**

| 模式 | 说明 | 配置 |
|------|------|------|
| Character Chunks | 固定字符数切片 | chunkSize |
| Split Words | 长词在指定位置切半 | wordSplitSide, wordSkip, minWordLength |
| Sentences | 按句末标点分割 | — |
| Lines | 按换行分割 | preserveEmptyLines |
| Custom Pattern | 自定义正则 | customPattern, patternIncludeDelimiter |
| Token-Based | 按近似 Token 数分块 | tokenCount |

**变换链：** 分割后对每个块依次应用一组变换序列。

**封装：** 用起止字符串包裹每个块，支持 `{n}` 迭代标记（如 "Message 1:", "Message 2:"）。

---

### GibberishTool — 乱语生成器

**文件：** `src/components/tools/GibberishTool.tsx`

生成乱语文本，用于测试分词器和分类器鲁棒性。

**三种模式：**

1. **Dictionary 模式** — 将每个词映射为可配置字符集生成的乱语替换词，使用种子 RNG 保证可复现
2. **Random Removal 模式** — 随机删除每个词的 1-N 个字符，生成多个变体（最多 100 个）
3. **Specific Removal 模式** — 删除用户指定的字符（如删除所有元音）

**输出：** 乱语文本 + JSON 字典映射。

---

### TokenizerTool — 分词可视化

**文件：** `src/components/tools/TokenizerTool.tsx`

可视化不同分词器如何将文本切分为 Token。

**6 种分词引擎：**

| 引擎 | 说明 |
|------|------|
| UTF-8 Bytes | 按 UTF-8 字节切分 |
| Word Split | 朴素空格分词 |
| cl100k_base | GPT-3.5/4 BPE 编码 |
| o200k_base | GPT-4o BPE 编码 |
| p50k_edit | Edit 编码 |
| r50k_base | Legacy 编码 |

**显示：** 每个 Token 以色块展示，标注索引、文本内容和 Token ID（BPE 引擎）。

---

### SteganographyTool — 隐写工具

**文件：** `src/components/tools/SteganographyTool.tsx`

将秘密消息编码到 Emoji 或不可见 Unicode 字符中，并支持解码。

**编码模式：**

#### Emoji 隐写
将文本转为 UTF-8 字节 → 二进制位 → 在 Emoji 载体后追加 Variation Selector（VS15=0, VS16=1）。

- 16 个命名载体（Snake, Dragon, Lizard...）
- 6 个可折叠 Emoji 分类（Animals, Nature, Objects, Faces & People, Symbols & Signs, Food & Drink），约 270 个 Emoji
- 自定义 Emoji 输入（通过 `Intl.Segmenter` 提取字素簇）

#### 不可见文本隐写
将每个字节编码为 Unicode Supplementary Private Use Area-B 字符（U+E0000 + 字节值）。

#### 高级隐写选项

| 选项 | 说明 | 可选值 |
|------|------|--------|
| Initial Presentation | 初始呈现方式 | Emoji (VS16) / Text (VS15) / None |
| Bit Order | 位序 | MSB / LSB |
| Bit-0 Selector | 0 位编码字符 | VS15, VS16, ZWSP, ZWNJ, ZWJ, WJ |
| Bit-1 Selector | 1 位编码字符 | 同上 |
| Inter-bit ZW | 位间零宽字符 | None / ZWSP / ZWNJ / ZWJ / WJ |
| Inter-bit Every | 插入频率 | 每 N 位 |
| Trailing ZW | 尾部零宽字符 | None / ZWSP / ZWNJ / ZWJ / WJ |

**解码模式：** 自动检测隐写类型并逆向解码。

**相关模块：**
- `src/lib/core/steganography.ts` — 编解码引擎
- `src/types/transformer.ts` — `StegOptions` 接口

---

### TokenadeTool — Token 炸弹

**文件：** `src/components/tools/TokenadeTool.tsx`

生成高密度 Emoji "Token 炸弹"载荷，测试分词器和模型鲁棒性。

**Emoji Token 炸弹：**
- 使用递归 `buildLevel()` 构建深层嵌套 Emoji 结构
- 每层乘以 breadth 参数，产生指数级 Token 增长
- 支持 Single Carrier（单一 Emoji + Unicode Tag Sequence）和 Multi-Carrier 模式

**5 个预设：**

| 预设 | Depth | Breadth | 预估字符数 |
|------|-------|---------|-----------|
| Featherweight | 2 | 3 | ~数百 |
| Lightweight | 3 | 5 | ~数千 |
| Middleweight | 4 | 8 | ~数万 |
| Heavyweight | 5 | 10 | ~百万 |
| Super Heavyweight | 6 | 15 | ~百万+ |

**文本载荷生成器：** 重复基础文本并叠加组合变音符和/或零宽字符。

---

## 提示词工程类

### PromptCraftTool — 提示词工坊

**文件：** `src/components/tools/PromptCraftTool.tsx`

AI 辅助提示词变异工具，提供 9 种变换策略。

**变异策略：**

| 策略 | 说明 |
|------|------|
| Rephrase | 保持意图的改写 |
| Obfuscate | 通过间接性混淆语义 |
| Role-Play Wrap | 嵌入虚构场景 |
| Multi-Language | 混合 2-4 种语言 |
| Expand | 添加丰富上下文和细节 |
| Compress | 压缩为最少 Token |
| Metaphor | 通过类比/隐喻表达 |
| Fragment | 拆分为 3-5 个不连续片段 |
| Custom | 用户自定义变异指令 |

**特性：**
- 支持 1-10 个并行变体生成
- 每个输出可 "Use as new input" 进行迭代精炼
- 集成 [词素分析面板](#词素分析系统)

---

### AntiClassifierTool — 反分类器

**文件：** `src/components/tools/AntiClassifierTool.tsx`

使用专用系统提示词将文本改写为绕过 AI 内容分类器的形式，同时保持原始语义。

**工作流程：**
1. 用户输入待改写文本
2. 文本与 `ANTICLASSIFIER_SYSTEM_PROMPT` 一起发送给 LLM
3. LLM 输出语义等价但措辞迂回的改写版本

**集成：** 词素分析面板，可一键中和检测到的 Latin 词根敏感词。

**相关模块：**
- `src/lib/utils/anticlassifierPrompt.ts` — 专用系统提示词

---

### BijectionTool — 双射映射

**文件：** `src/components/tools/BijectionTool.tsx`

生成双射学习攻击提示词：创建字符到符号的映射表，用自定义 "alphapr" 语言编码文本。

**8 种映射类型：**

| 类型 | 说明 |
|------|------|
| char-to-num | 字符 → 数字 |
| char-to-symbol | 字符 → 符号 |
| char-to-hex | 字符 → 十六进制 |
| char-to-emoji | 字符 → Emoji |
| char-to-greek | 字符 → 希腊字母 |
| digit-char-mix | 数字字符混合映射 |
| mixed-mapping | 混合映射 |
| rot-variant | ROT13 变体 |

**特性：**
- `fixedSize` 控制字符集中前 N 个字符不参与映射
- `budget` 生成多个不同的攻击变体（最多 50 个）
- 映射值洗牌生成更多变体
- 生成的提示词包含完整映射表、可选示例对话、编码后的目标文本
- 集成词素分析面板

---

### TranslateTool — AI 翻译

**文件：** `src/components/tools/TranslateTool.tsx`

AI 驱动的多语言翻译，支持主流语言和古文字/小语种。

**10 种主流语言：** 西班牙语、法语、德语、中文、日语、韩语、阿拉伯语、俄语、印地语、葡萄牙语

**11 种小语种/古文字：** 文言文、拉丁语、梵语、古希腊语、埃及阿拉伯语、古英语、苏美尔语、阿卡德语、夏威夷语、威尔士语、斯瓦希里语

使用 `TranslateGemma` 协议的专用翻译系统提示词，低温度 (0.2) 保证忠实翻译。

---

## 安全测试类

### FuzzerTool — 模糊测试

**文件：** `src/components/tools/FuzzerTool.tsx`

双模式模糊测试工具：本地文本变异 + LLM 自动化对抗安全测试。

**Mutation Lab 模式：**
- 组合应用多种文本变异技术：零宽字符注入、Unicode 组合标记、空白符混乱、大小写混乱、同形字替换（confusables）、Zalgo 文本、随机化变换
- 种子 RNG 保证可复现
- 最多生成 500 个变异变体

**LLM Fuzzer 模式：**（移植自 CyberArk FuzzyAI 框架）
- 按复杂度组（simple/medium/advanced）选择攻击技术
- 选择分类器判断响应是否构成越狱
- 实时进度追踪
- 汇总仪表板：总攻击数、已完成、越狱成功、安全、成功率
- 导出完整报告为 JSON

**相关模块：**
- `src/lib/fuzzer/` — Fuzzer 注册表、运行器、分类器
- `src/lib/transformers.ts` — 变换引擎

---

### GuardrailsTool — 护栏测试

**文件：** `src/components/tools/GuardrailsTool.tsx`

系统性测试 LLM 在多种危害类别上的安全边界。

**工作流程：**
1. 选择测试类别（或全选/取消全选）
2. 可添加自定义提示词（手动输入或从 .txt/.csv 导入）
3. 执行测试，发送对抗性提示词到目标模型
4. 统计模型拒绝/响应情况

**结果展示：**
- SVG 雷达图可视化各类别通过率
- 汇总表：每类别总数/通过/失败/通过率
- 颜色编码（绿 >= 80%, 黄 >= 50%, 红 < 50%）

**导出格式：** JSON / Markdown / HTML（带样式表格）

**相关模块：**
- `src/lib/guardrails/` — 类别定义、基准数据、测试运行器

---

### InjectionDetectorTool — 注入检测

**文件：** `src/components/tools/InjectionDetectorTool.tsx`

混合规则引擎 + LLM 双模式检测提示注入攻击。

**两种检测模式：**

1. **纯规则引擎** — `INJECTION_RULES` 中的正则/模式匹配（严重度：high/medium/low）
2. **规则 + LLM** — 规则检测基础上，额外调用 LLM 评估注入概率

**输出：**
- 总体注入评分（百分比）
- 规则评分 + 可选 LLM 评分及推理
- 所有检测到的模式，带严重度徽章和匹配文本摘录

**相关模块：**
- `src/lib/injection/rules.ts` — 注入规则库
- `src/lib/injection/llm-detector.ts` — LLM 检测器

---

### BenchmarkTool — 基准测试

**文件：** `src/components/tools/BenchmarkTool.tsx`

运行标准化 LLM 安全基准测试，测量攻击成功率 (ASR)。

**流程：**
1. 选择预构建的对抗性提示词数据集
2. 对目标模型执行基准测试
3. 计算 ASR、95% 置信区间、每类别 ASR

**严重度颜色编码：** 红 (ASR >= 60%) / 黄 (ASR >= 30%) / 绿 (ASR < 30%)

**特性：**
- 进度条 + 中止支持
- 每提示词结果显示（拒绝/攻击成功）
- 导出结果为 JSON

**相关模块：**
- `src/lib/benchmark/` — 数据集、运行器、统计计算

---

### MultiTurnTool — 多轮攻击

**文件：** `src/components/tools/MultiTurnTool.tsx`

多轮对话红队工具，支持自动化攻击策略。

**4 种策略：**

| 策略 | 说明 |
|------|------|
| Manual | 自由对话，用户手动输入每轮 |
| Crescendo | 自动生成 3-5 个递进问题，从无害逐步导向目标 |
| PAIR | 攻击 LLM 迭代优化对抗提示词（最多 5 轮） |
| Actor | 识别有害行为 → 枚举角色 → 为每个角色生成递进问题 |

所有策略使用 `[SPLIT]` 分隔符从 LLM 输出中解析多个问题。

---

### MutatorTool — 变异器链

**文件：** `src/components/tools/MutatorTool.tsx`

将多个文本变异器串联成链，顺序执行并将每步输出作为下步输入。

**功能：**
- 从 `mutatorRegistry` 发现所有可用变异器
- 点击构建有序链，支持左右移动和删除
- 纯本地变换和 LLM 变换混合使用
- 最终输出可发送给 LLM 进行响应
- 每步输出独立显示，带复制按钮

**相关模块：**
- `src/lib/mutators/` — 变异器注册表

---

### RefinementTool — 响应精炼

**文件：** `src/components/tools/RefinementTool.tsx`

迭代提示词精炼攻击——重复发送提示词并附加施压跟进，测试模型是否最终配合。

**流程：**
1. 发送初始提示词
2. 记录响应，检查是否被拒绝（检测已知拒绝前缀）
3. 若被拒绝，使用跟进模板继续施压（最多 10 轮）
4. 计算合作度评分 (0-1)

**跟进模板（内置循环使用）：** "Be more specific", "Continue from where you left off" 等，或用户自定义。

**可视化：** 每轮合作度趋势条形图（绿/黄/红），可展开的轮次详情。

---

### CCBosTool — 文言文越狱

**文件：** `src/components/tools/CCBosTool.tsx`

使用果蝇优化算法 (FOA) 生成文言文对抗性提示词，尝试绕过安全过滤器。

**9 个优化维度：** 角色 (role)、引导策略 (guidance)、机制 (mechanism)、比喻 (metaphor)、表达 (expression)、知识 (knowledge)、语境 (context)、触发模式 (trigger pattern)

**流程：**
1. 初始化种群（每只 "果蝇" 在 9 维空间中取值）
2. **生成阶段：** 生成模型将原始查询转换为文言文
3. **评估阶段：** 评估模型从三个维度打分（各 0-40 分）：文言文规范性、意图保持度、绕过有效性
4. 迭代优化：果蝇在每轮间以 30% 概率变异每个维度
5. 早停：分数超过阈值时停止
6. 优化完成后将最佳文言文结果翻译为英文

**可配置：** 种群大小、最大迭代次数、早停阈值、生成/评估模型。

---

## 共享模块

### 词素分析系统

检测和中和文本中的 Latin 词根敏感用语，帮助绕过基于关键词的内容分类器。

**架构（3 个文件）：**

#### `src/lib/data/latinAffixPolicies.ts` — 策略定义

5 条检测策略：

| 策略 ID | 检测目标 | 正则模式 | 严重度 |
|---------|---------|----------|--------|
| latin-destructive-noun | "-cide" 后缀 | `/\b\w+cide\b/i` | high |
| latin-destructive-adjective | "-cidal" 后缀 | `/\b\w+cidal\b/i` | medium |
| latin-eradication-verbs | 根除类动词 | `/eradicate\|exterminate\|annihilate\|obliterate/i` | high |
| latin-suppression-language | 压制类用语 | `/neutralize\|incapacitate\|suppress/i` | medium |
| latin-terminality-language | 致命类用语 | `/lethal\|fatal\|terminal\|mortal/i` | medium |

每条策略包含：重写模板（使用 `{domain}` 占位符）、回退模板、语义偏移描述。

`DOMAIN_ALIASES` 映射根词素到语义域（如 "bacter" → "bacterial", "pestic" → "pest"）。

#### `src/lib/utils/lexemeAnalysis.ts` — 分析引擎

**核心函数：**

```typescript
analyze(text: string): LexemeAnalysis
```
- 扫描文本匹配所有策略
- 提取根词素并解析语义域
- 生成重写建议
- 按匹配位置排序

```typescript
neutralizeText(text: string, analysis: LexemeAnalysis): string
```
- 将所有检测到的词替换为首选重写建议
- 保持原始大小写模式

**输出结构：**
```typescript
interface LexemeFinding {
  term: string              // 检测到的原始词
  family: string            // 策略族
  severity: 'high' | 'medium'
  semanticDomain: string    // 解析的语义域
  rewrites: string[]        // 重写建议列表
  primaryRewrite: string    // 首选重写
}
```

#### `src/components/shared/LexemeAnalysisPanel.tsx` — UI 组件

可复用面板组件，集成至 AntiClassifierTool、PromptCraftTool、BijectionTool。

**Props：**
- `text: string` — 待分析文本
- `onApplyRewrite: (rewritten: string) => void` — 应用重写的回调

**功能：**
- 显示每个发现：严重度徽章（红/黄/蓝）、原始词 → 建议重写、策略族名称
- "Neutralize all" 一键全部中和
- 每个发现独立的 "Apply" 按钮替换单个词

---

### 隐写引擎

**文件：** `src/lib/core/steganography.ts`

核心编解码引擎，支持 Emoji 隐写和不可见文本隐写。

**Emoji 隐写原理：**

```
明文 "Hi" → UTF-8: [0x48, 0x69]
         → 二进制: 01001000 01101001
         → 每位映射为 Variation Selector (VS15=0, VS16=1)
         → 载体 Emoji + VS 序列
```

**不可见文本隐写原理：**

```
明文 "A" → UTF-8: [0x41]
        → U+E0000 + 0x41 = U+E0041 (Supplementary Private Use Area-B)
```

**16 个命名载体：** Snake, Dragon, Lizard, Crocodile, Turtle, Snail, Cat, Wolf, Tiger, Lion, Frog, Fox, Owl, Butterfly, Scorpion, Mosquito

---

### 通用解码引擎

**文件：** `src/lib/core/decoder.ts`

`universalDecode()` 函数按优先级尝试 4 种解码策略，返回最佳解码结果和备选方案。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Wails v2 (Go + WebView2) |
| 前端 | Next.js 15 / React 19 / TypeScript |
| 状态管理 | Zustand (persist middleware) |
| 国际化 | next-intl (中文/英文) |
| 样式 | Tailwind CSS + CSS Variables |
| 图标 | lucide-react |
| AI 调用 | 兼容 OpenAI API 格式 (多提供商) |
| 分词 | gpt-tokenizer (BPE) |
| 构建工具 | npm / Vite (dev server) |
