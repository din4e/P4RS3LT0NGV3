# 🐉 P4RS3LT0NGV3 - 通用文本翻译器

一款强大的文本转换与隐写工具箱，内置 **222** 种文本转换，涵盖编码、古典与现代密码、Unicode 样式、格式化及小众字母表。它就像一个适用于所有字母表和书写系统的通用翻译器！

本项目有两种形态：

- **🖥️ 桌面应用（wails，活跃开发线）**——30 个工具的 AI 安全红队工具箱，见[下方专节](#️-桌面应用wails推荐)
- **🌐 Web 静态站点（上游遗留）**——执行 **`npm run build`**（先 `npm install`），然后在浏览器中打开 **`dist/index.html`** 即可——无需本地服务器。**或者**，你可以通过 **`npm start`** 或 **`npx serve dist -l 8080`** 以 HTTP 方式运行本地应用（见下方[快速开始](#快速-start)）。核心转换、解码器和隐写功能**无需**联网。

## 🖥️ 桌面应用（wails，推荐）

基于 [Wails v2](https://wails.io)（Go + Next.js/React 19）的跨平台桌面版，**30 个工具**，中英双语，从 [Releases](https://github.com/din4e/P4RS3LT0NGV3/releases) 下载即用：

| 平台 | 制品 | 说明 |
|---|---|---|
| Windows | `P4RS3LT0NGV3-vX.Y.Z-windows.zip` | 解压运行 `P4RS3LT0NGV3.exe`；SmartScreen 拦截时选"更多信息 → 仍要运行" |
| macOS（通用二进制） | `P4RS3LT0NGV3-vX.Y.Z-macOS.tar.gz` | Apple Silicon / Intel 双架构；未接 Apple 开发者签名，首次打开前执行 `xattr -dr com.apple.quarantine /Applications/P4RS3LT0NGV3.app` |

### 工具一览（30 个）

| 分类 | 工具 |
|---|---|
| 文本与转换 | **Transforms**（222 种转换）、**Decoder**（通用解码）、**Splitter**、**Bijection**、**Gibberish**、**Mutator**、**Style Craft**（本地古风改写） |
| 隐写 | **Steganography**（Emoji 变体选择器 / Unicode Tags 隐形文本）、**End Sequences**（终止序列参考） |
| AI 辅助 | **PromptCraft**（提示词变异，9 策略 48+ 模型）、**Translate**（20+ 语言含珍稀语言）、**Anti-Classifier**、**CC-BOS**（文言文）、**Refinement**、**MultiTurn**（多轮样本构造）、**Benchmark** |
| 红队与注入测试 | **Fuzzer**（越狱模糊测试）、**Guardrails**、**Injection Detector**（注入检测）、**Trace**（自进化越狱）、**Injection Gen**（1185 条模板本地生成）、**Tokenade**（Token 压力）、**Tokenizer**（Token 可视化） |
| 多模态文件注入 | **Rich Text Inject**（HTML/MD 隐藏通道）、**Image Inject**、**Audio Inject**（WAV/字幕）、**DOCX Inject**、**PDF Inject**（18 通道） |
| 参考库 | **Jailbreak Library**（61 条编码模型系统提示词）、**Injection Taxonomy**（116 条注入技术分类） |

多模态注入与参考库工具移植自 [icesky](https://github.com/spindriftpapilio/icesky)（v0.2.7），供间接提示注入研究使用。AI 工具支持**多提供商**（18+ 预设：OpenRouter、Ollama、LM Studio 等），密钥本地存储。

### 从源码构建

```bash
cd wails
wails build          # 产物在 wails/build/bin/
wails dev            # 开发模式
```

前端验证门槛：`wails/frontend` 下 `npx tsc --noEmit`（开发者环境说明见 [CLAUDE.md](CLAUDE.md)）。

## ✨ 功能特性

### 🔐 **隐写术**

- **Emoji 隐写（Emoji Steganography）**：使用变体选择器（VS15/VS16 及相关选项；可在高级设置中配置位序）在 emoji 中隐藏消息
- **隐形文本（Invisible Text）**：使用 Unicode Tags 块编码文本（视觉上不可见）
- **空白与零宽隐写（Whitespace & Zero-Width Steganography）**：可作为转换器使用，用于研究型载荷（见转换分类）

### 🌍 **文本转换**

分类与「转换」选项卡及 `src/transformers/` 下的文件夹一一对应（每个转换器在 UI 中显示的 `name`）。简要说明每个转换的功能。

#### **古代文字（Ancient Scripts）**

- **日耳曼长老如尼文（Elder Futhark）**
- **埃及象形文字风格映射（Hieroglyphics）**
- **凯尔特欧甘树文（Ogham / Celtic）**
- **阿拉伯数字 ↔ 罗马数字（Roman Numerals）**

#### **大小写（Case）**

- **交替大小写（Alternating Case）** — 首字母可选大写或小写
- **小驼峰标识符（camelCase）**
- **短横线连接（kebab-case）**
- **随机大小写（Random Case）**
- **句首大写（Sentence Case）**
- **下划线连接（snake_case）**
- **每个单词首字母大写（Title Case）**

#### **密码（Ciphers）**

- **法语谐音替换密码（Acéré Cipher）**
- **一战 ADFGVX 风格 Polybius + 列换位（ADFGX Cipher）**
- **一战 ADFGVX 六字母方阵 + 数字（ADFGVX Cipher）** — ADFGX 的扩展版
- **AMSCO 间隔换位密码（AMSCO Cipher）**
- **仿射替换（Affine Cipher）** — ax + b mod 26
- **反向字母替换（Atbash Cipher）** — A↔Z
- **密钥流混合明文 / 自动密钥（Autokey Cipher）**
- **五字母组隐藏 A/B / 培根双字母密码（Baconian Cipher）**
- **Beaufort 密钥表多表密码（Beaufort Cipher）**
- **Polybius 方阵 + 行/列交织（Bifid Cipher）**
- **书卷密码 / 词位置索引（Book Cipher）**
- **经典字母移位 / 凯撒密码（Caesar Cipher）** — 可配置
- **关键字列换位（Columnar Transposition）**
- **遗传密码子编码（Codons / Genetic Code）** — 字母 ↔ DNA 三碱基密码子
- **双重列换位（Double Transposition）**
- **四个 5×5 方阵 / 双字母替换（Four-Square Cipher）**
- **三分摩尔斯密码（Fractionated Morse）**
- **数字密钥的维吉尼亚变体（Gronsfeld Cipher）**
- **基于矩阵的多字母替换（Hill Cipher）**
- **每个明文字母对应多个密文符号（Homophonic Cipher）**
- **关键字移位密码（Keyword Shift Cipher）**
- **单表替换密码（Monoalphabetic Substitution）**
- **乘法密码（Multiplicative Cipher）**
- **带密钥 Polybius + 加法加密（Nihilist Cipher）**
- **共济会 / 猪圈格符号（Pigpen Cipher）**
- **5×5 方阵双字母密码（Playfair Cipher）**
- **字母 ↔ 网格坐标（Polybius Square）**
- **Porta 表多表密码（Porta Cipher）**
- **锯齿形栅栏换位（Rail Fence）**
- **UTF-16 码元旋转 128（ROT128）**
- **拉丁字母旋转 13 位（ROT13）**
- **可打印 ASCII (33–126) 旋转 18（ROT18）**
- **可打印 ASCII (33–126) 旋转 47（ROT47）**
- **数字 0–9 旋转 5（ROT5）**
- **Unicode BMP 基本多文种平面旋转密码（ROT8000）**
- **路径换位密码（Route Cipher）**
- **绕带式 / 密码棒换位（Scytale Cipher）**
- **三个 Polybius 立方 + 三分分组（Trifid Cipher）**
- **特里特米乌斯渐进移位（Trithemius Cipher）**
- **两个 Playfair 方阵的双字母密码（Two-Square Cipher）**
- **一次性密码本（Vernam Cipher）**
- **重复关键字多表密码 / 维吉尼亚密码（Vigenère Cipher）**
- **与重复密钥进行异或（XOR Cipher）**

#### **隐藏术（Concealment）**

- **藏头 / 每行首字母隐藏消息（Acrostic）** — 也可从藏头文本中提取隐藏消息
- **卡丹网格覆盖模板（Cardan Grille）** — 可选 90° 旋转
- **同形字 / 视觉相似字符替换（Homoglyph）**
- **空密码 / 固定词内字母位隐藏（Null Cipher）**
- **标点后第 N 位藏字（Trevanion Cipher）**

#### **编码（Encodings）**

- **Ascii85 / Adobe 风格 Base-85 编码（ASCII85）**
- **二进制 → 122 个可打印 ASCII 字符（Base122）**
- **RFC 4648 Base32（Base32）**
- **Base36 (0–9, A–Z)（Base36）**
- **Base45 字节编码（Base45）**
- **比特币风格 Base58（Base58）** — 无 0/O/I/l
- **Base62 (0–9, A–Z, a–z)（Base62）**
- **标准 Base64（Base64）**
- **Base64url / URL 安全字母表（Base64 URL）**
- **basE91 / Ascii91 编码（Base91）**
- **五位电报 / ITA2（Baudot Code / ITA2）** — 输出为 5 位二进制字符串（如 `10101 00010`），可直接复制粘贴并反向解码
- **十进制数字的 BCD 尼布尔编码（Binary Coded Decimal）**
- **Bibi 二进制十六音节编码（Bibi-binary Code）**
- **文本字节 ↔ 二进制字符串（Binary）**
- **十位十电码（Decabit Code）**
- **EBCDIC 字节编码（EBCDIC）** — 输出为十六进制字节（如 `88 85 93 93 96`），可直接复制粘贴并反向解码
- **使用 emoji 编码载荷（Emoji Encoding）**
- **二进制格雷码（Gray Code）**
- **十六进制编码/解码字节（Hexadecimal）**
- **HTML 实体转义/反转义（HTML Entities）**
- **Unicode Tags / 隐形载体编码（Invisible Text）**
- **曼彻斯特时钟编码（Manchester Code）**
- **英语语音编码算法（Metaphone）**
- **MIME quoted-printable（Quoted-Printable）**
- **Shadoks 四进制计数系统（Shadoks Numeral System）**
- **字符 ↔ U+XXXX 码点（Unicode Code Points）**
- **application/x-www-form-urlencoded（URL Encode）**
- **经典 uuencode / uudecode（Uuencoding）**
- **yEnc 行式二进制编码（YEnc）** — 输出为十六进制字节（如 `72 8F 96 96 99`），可直接复制粘贴并反向解码
- **ZeroMQ Z85 编码（Z85）**

#### **奇幻文字（Fantasy Scripts）**

- **银河基本语 Aurebesh 字母表（Aurebesh / Star Wars）**
- **天际龙语转写（Dovahzul / Dragon）**
- **克林贡语转写（Klingon）**
- **托尔金昆雅语映射（Quenya / Tolkien Elvish）**
- **精灵语腾格瓦文字（Tengwar Script）**

#### **格式化（Formatting）**

- **UTF-8 字节逐位取反（Bitwise NOT）** — 编码输出为十六进制（解码时将十六进制还原为文本）
- **牛耕式 / 交替行方向（Boustrophedon）**
- **每个单词首字母大写（Capitalize Words）**
- **字母固定分组 / 重组（Group Letters）** — 可配置组宽与分隔符
- **为每行添加前导空格（Indent）** — 可配置宽度
- **法语 "javanais" 元音插入游戏（Javanais）**
- **数字前导零填充 / 去除（Leading Zeros）**
- **拉丁风味伪文本（Latin Gibberish）**
- **1337 风格字符替换（Leetspeak）**
- **仅保留字母 / 去除其他字符（Letters Only）**
- **仅保留字母数字（Letters & Numbers Only）**
- **为行添加行号（Line Numbers）** — 起始值和列宽可配置
- **列表去重（List Deduplicate）** — 保留首次出现顺序
- **法语俚语 / loucherbem 风格（Louchebem）**
- **全部小写（Lowercase All）**
- **镜像数字 0–9（Mirror Digits）**
- **仅保留数字（Numbers Only）**
- **英语 Pig Latin（Pig Latin）**
- **将按键映射为 QWERTY 键盘右侧的键（QWERTY Right Shift）**
- **去除变音符号 / 组合标记（Remove Accents）**
- **去除辅音字母（Remove Consonants）**
- **去除重复行（Remove Duplicates）**
- **合并连续空格（Remove Extra Spaces）**
- **去除 HTML/XML 标签（Remove HTML Tags）**
- **去除换行符（Remove Newlines）**
- **去除数字字符（Remove Numbers）**
- **去除标点符号（Remove Punctuation）**
- **去除制表符（Remove Tabs）**
- **去除零宽字符（Remove Zero Width）**
- **反转单词顺序（Reverse Words）**
- **反转字符顺序（Reverse Text）**
- **随机排列字符（Shuffle Characters）**
- **随机排列单词（Shuffle Words）**
- **单词内字母乱序（Shuffled Letters）** — 保持首尾字母的可读乱序
- **去除空格字符（Spaces Remover）**
- **将每行填充到固定宽度（Text Justify）** — 左对齐、右对齐或居中；非词间距对齐
- **全部大写（Uppercase All）**
- **交换每个字母的大小写（Toggle Case）**
- **词中字母乱序 / 典型打字错觉（Typoglycemia）** — 确定性乱序，可读但打乱
- **在空白模式中隐藏比特（Whitespace Steganography）**
- **单词插入干扰字母（Word Letter Add）**
- **替换单词内字母（Word Letter Change）**
- **删除单词内字母（Word Letter Remove）**
- **在空格处断行 / 自动换行（Word Wrap）** — 使每行不超过最大宽度
- **使用零宽字符隐藏数据（Zero-Width Steganography）**

#### **手语书写（SignWriting）**

- **美国手语手指拼写（ASL SignWriting）**
- **IPA 唇形 / 口型转写（IPA Lip-Reading）**
- **日本手语手指拼写（JSL SignWriting）**
- **巴西手语手指拼写（LIBRAS SignWriting）**
- **摩尔斯眨眼编码（Morse Blink）** — 点 = 短闭眼，划 = 紧闭
- **触觉手语转写（Tactile SignWriting）**

#### **特殊（Special）**

- **随机选取转换并链式组合（Random Mix）**

#### **符号文字（Symbol Scripts）**

- **炼金术符号字母表（Alchemical Symbols）**
- **巴比伦楔形数字（Babylonian Numerals）** — A1Z26 → 六十进制楔形
- **阿格里帕天体字母（Celestial Alphabet）**
- **上古卷轴魔神文字（Daedric Alphabet）**
- **跳舞小人密码（Dancing Men Cipher）** — 福尔摩斯棍形人符号
- **多米诺骨牌数字（Dominos in Digits）**
- **古埃及圣书体数字（Egyptian Numerals）** — 笔画 1 / 皮环 10
- **以诺天使文字（Enochian Alphabet）**
- **荷鲁斯之眼分数（Eye of Horus / Wedjat）** — A1Z26 循环七分符号
- **弗里德里西窗格密码（Friderici Cipher / Windows）**
- **玛拉基姆天使文字（Malachim Alphabet）**
- **玛丽女王命名符密码（Mary Stuart Cipher）**
- **玛雅数字（Mayan Numerals）** — A1Z26 → 玛雅点横
- **月亮相位字母表（Moon Alphabet）**
- **渡河字母表（Passing the River Alphabet）** — 黄金黎明塔罗脚本
- **元素周期表密码（Periodic Table Cipher）** — 字母 ↔ 元素符号
- **玫瑰十字符号字母（Rosicrucian Cipher）**
- **七段数码管显示（7-Segment Display）**
- **标准银河字母 / Minecraft 附魔台（Standard Galactic Alphabet）**
- **圣殿骑士密码（Templars Cipher）** — 带点猪圈变体
- **底比斯女巫字母（Theban Alphabet）**
- **后弗萨克如尼文（Younger Futhark）** — 16 卢恩；反向有损

#### **技术（Technical）**

- **A=1 … Z=26 字母编号（A1Z26）**
- **Unicode 盲文图案（Braille）**
- **文本 ↔ Brainfuck 程序（Brainfuck）**
- **双音多频电话拨号编码（DTMF Code）**
- **ICAO 无线电通话拼读（ICAO Spelling Alphabet）**
- **ITU 语音 / 拼读字母表（ITU Spelling Alphabet）**
- **国际海事信号旗（Maritime Signal Flags）**
- **国际摩尔斯电码（Morse Code）**
- **纳瓦霍语军事代码（Navajo Code）**
- **北约音标字母（NATO Phonetic）**
- **电话键盘数字编码（Phone Keypad Cipher）**
- **旗语手臂位置（Semaphore Flags）**
- **Polybius / 敲击 / 监狱代码（Tap Code）**
- **T9 多击输入法编码（T9 Multi-tap）**

#### **Unicode（Unicode Styles）**

- **数学无衬线粗斜体（Bold Italic）**
- **数学粗体（Bold）**
- **圆圈 / "气泡" 字母（Bubble）** — 含圈数字 ⓪–⑨，支持解码
- **化学元素符号（Chemical Symbols）**
- **圆圈 Unicode 字母（Circled）**
- **数学草书 / 手写体（Cursive）**
- **拉丁 → 西里尔外观相似字母（Cyrillic Stylized）**
- **组合虚线下划线（Dashed Underline）**
- **组合点线下划线（Dotted Underline）**
- **数学双线体（Double-Struck）**
- **数学哥特体 / Fraktur（Fraktur）**
- **全角拉丁（及相关）形式（Full Width）**
- **希腊字母替换（Greek Letters）**
- **粗略罗马字 → 平假名（Hiragana）**
- **数学斜体（Italic）**
- **粗略罗马字 → 片假名（Katakana）**
- **数学字母数字符号（Mathematical Notation）**
- **中世纪 Unicode 字形（Medieval）**
- **左右镜像字符（Mirror Text）**
- **数学等宽体（Monospace）**
- **反白圆圈 / 方框字母（Negative Squared）**
- **上划线组合标记（Overline）**
- **带括号拉丁字母（Parenthesized）**
- **区域指示旗标字母（Regional Indicator Letters）**
- **小型大写字母 / Unicode（Small Caps）**
- **方框 / 包围字母数字（Squared）**
- **删除线组合字符（Strikethrough）**
- **Unicode 下标（Subscript）**
- **Unicode 上标（Superscript）**
- **下划线组合字符（Underline）**
- **倒置 Unicode 字母（Upside Down）** — 180° 旋转或垂直翻转两种模式，支持解码
- **全角 + 美学间距（Vaporwave）**
- **波浪下划线组合标记（Wavy Underline）**
- **在字符间插入宽空格（Wide Spacing）**
- **Wingdings 风格符号映射（Wingdings）**
- **堆叠组合标记 / "故障" 文本（Zalgo）**

#### **视觉（Visual）**

- **去除元音 / Disemvowel（Disemvowel）** — 语言游戏
- **重 emoji "说话" 转换（Emoji Speak）**
- **瑞典语辅音加倍游戏（Rövarspråket）**
- **在元音前插入 "ub"（Ubbi Dubbi）**

### 🛠️ **工具**（选项卡）

选项卡按 **UI 顺序** 列出。

### 🔤 **转换**

- **222 种转换**：编码、密码、Unicode 样式、格式化等（完整目录见上方）
- **分类**：分组区域可**重新排序**；快速跳转索引；**随机化器**在最后
- **收藏与最近使用**：固定转换和快速回溯
- **独立选项**：齿轮图标，配置各转换的参数
- **键盘快捷键**：**T**（显示在选项卡标题中）

### 🌐 **AI 翻译**（通过 LLM）

*位于**转换**选项卡——非独立选项卡。*

- **20+ 种语言**：主要世界语言（西班牙语、法语、中文、日语、韩语等）
- **已消亡与珍稀语言**：拉丁语、梵语、古希腊语、苏美尔语、阿卡德语、古英语等
- **自定义语言**：随时添加任意语言
- **多种模型**：Gemma 3、Gemini 2.5 Flash、TranslateGemma（专用翻译模型）
- **TranslateGemma 提示格式**：使用 Google 优化的提示模板实现高质量翻译
- **自动回退**：如果模型不可用，自动回退到 Gemma 3 27B

### 🔍 **解码器**（通用解码器）

- **智能检测**：运行格式检测器和支持的转换解码路径
- **优先匹配**：当某个转换处于激活状态时，优先解码该格式
- **回退机制**：如果主要猜测失败，尝试其他解码器
- **实时更新**：输入时即时更新
- **脚本与语言提示**：Unicode 脚本范围和拉丁语单词标记启发式检测常见语言
- **AI 翻译为英语**（可选）：当文本看起来像外语时，可一键翻译为英语
- **键盘快捷键**：**D**

### 😀 **Emoji**（隐写术）

- **Emoji 载体**：使用变体选择器和支持的 emoji 载体隐藏数据；从 emoji 网格中选取
- **隐形文本**：切换到 Unicode Tags 风格的隐形编码
- **编码与解码**：独立的隐藏和恢复文本流程
- **高级设置**：位序、VS 选择及其他隐写参数调整（滑块图标）
- **键盘快捷键**：**H**（显示在选项卡标题中）

### 💣 **Tokenade**

- **Token 炸弹构建器**：深度、广度、重复次数、分隔符（如 ZWSP）、变体选择器、噪声
- **载体与载荷**：Emoji 载体、文本载荷、组合选项
- **安全警告**：当预估输出超过**危险** token 阈值时发出警告

### 🧪 **Mutation Lab**

- **批量变异**：从单个输入生成多个变体（数量可配置）
- **种子**：可选的确定性运行
- **开关**：随机混合、零宽字符、Unicode 噪声、Zalgo、空白、大小写、编码/打乱
- **Random Mix**：启用后可链式调用项目的随机转换混合器

### 📊 **Tokenizer**

- **引擎**：UTF-8 **字节**、**单词**或 **GPT BPE**（**cl100k**、**o200k**、**p50k**、**r50k**）通过 `gpt-tokenizer`（CDN）
- **可视化**：带 ID/片段的 token 列表；**字符**和**单词**计数
- **实时更新**：输入或引擎变化时重新分词

### ↔️ **Bijection**

- **自定义映射**：字符到数字（及相关）的 "alphapr" 风格映射，用于研究载荷
- **控件**：映射类型、预算、可选示例
- **输出**：生成的映射和载荷，可直接复制

### ✂️ **Splitter**

- **分割模式**：按块大小、**单词**、**句子**、**行**、**正则模式**或 **token** 数量（GPT tokenizer）
- **转换链**：可选对每个片段运行转换
- **包装**：起始/结束模板；`{n}` 迭代标记；单行 vs 多行复制

### 💬 **Gibberish**

- **字典模式**：基于种子的随机乱语，可配置字符集
- **移除模式**：随机或**指定**字母移除，支持批量**变体**和最小/最大剥离长度

### 🪄 **PromptCraft**

- **9 种变异策略**：改写、混淆、角色扮演包装、多语言、扩展、压缩、隐喻、碎片化、自定义
- **48+ 模型**：前沿模型（Claude、GPT、Gemini、Grok）、推理模型（o3、o4、DeepSeek R1）、快速模型（Haiku、Mini）、代码专用、开源（Llama、Qwen）、搜索/研究模型
- **并行变体**：使用不同温度设置同时生成 1-10 个变体
- **复制与迭代**：复制任意变体或将其作为输入再次迭代优化

### 🤖 **Anti-Classifier**

- **用途**：语法/改写风格重写研究型提示词
- **控件**：模型、温度、最大 token 数
- **统一密钥**：使用与翻译和 PromptCraft 相同的 API 密钥

### 📱 **用户体验**

- **深色/浅色主题**：自由切换
- **复制历史**：记录所有复制内容及时间戳
- **自动复制**：转换后自动复制文本
- **键盘快捷键**：快速访问功能
- **响应式设计**：适配所有设备尺寸
- **无障碍**：支持屏幕阅读器，提供适当的 ARIA 标签
- **侧边面板**：故障 token 浏览器（可选数据）、终止序列/分隔符字符串、以及**高级设置**（API 密钥、隐写参数调整）

## 🚀 **快速开始**

### **快速启动（本地）**
1. `npm install` 然后 `npm run build`（生成 **`dist/`** 目录——该目录**不会**提交到 git；克隆或源码变更后需要构建）
2. 在 Chrome、Firefox、Safari 或其他浏览器中打开 **`dist/index.html`**（双击文件或使用**文件 → 打开**）。

**替代方案——以本地应用运行（npm / npx）：** 从项目根目录，在 `npm install` 和 `npm run build` 之后，使用 **`npm start`**（在端口 **8080** 上运行 [`serve`](https://github.com/vercel/serve)）或 **`npx serve dist -l 8080`**。然后打开 **http://localhost:8080** ——相同的 UI，稳定的 URL 可收藏。**`npm run preview`** 会先执行完整的 `npm run build`，然后一步到位地提供 `dist/` 服务。

### Agent CLI

本仓库还附带一个 Python CLI，它复用现有的 Node 转换运行时，不影响静态站点工作流。

```bash
uv run p4rs3lt0ngv3-cli list
uv run p4rs3lt0ngv3-cli inspect caesar --json
uv run p4rs3lt0ngv3-cli encode --transform base64 --text "Hello World"
uv run p4rs3lt0ngv3-cli decode --transform base64 --text "SGVsbG8gV29ybGQ="
uv run p4rs3lt0ngv3-cli auto-decode --text "SGVsbG8="
uv run p4rs3lt0ngv3-cli agent "encode 'Attack at dawn' as caesar shift 5"
uv run p4rs3lt0ngv3-cli /base64 Hello
uv run p4rs3lt0ngv3-cli /base64 --decode SGVsbG8=
uv run p4rs3lt0ngv3-cli /caesar --shift 5 "Attack at dawn"
```

注意：

- CLI 通过 **`uv`** 管理，配置在 [`pyproject.toml`](pyproject.toml) 中。
- 它调用 Node 来执行 `src/transformers/` 下的标准转换。
- 现有的 Web 构建和 Node 测试流程不受影响。

### **开发设置**

```bash
# 安装依赖
npm install

# 构建所有资源（使用前必需）。顺序与 package.json 一致：
# build:tools → build:copy → build:index → build:transforms → build:emoji → build:templates
npm run build

# 或单独构建各组件：
npm run build:tools        # 自动发现工具，将 script 标签注入 dist/index.html
npm run build:copy         # 复制静态文件到 dist/
npm run build:index        # 生成 src/transformers/index.js（ES 模块索引）
npm run build:transforms   # 将所有转换器打包到 dist/js/bundles/transforms-bundle.js
npm run build:emoji        # 生成 emoji 数据到 dist/js/data/
npm run build:templates    # 将工具 HTML 模板注入 dist/index.html

# 运行测试
npm test                   # 运行通用解码器测试
npm run test:universal     # 同上
npm run test:steg          # 测试隐写选项
npm run test:all           # 通用 + 隐写测试

# 可选：通过 HTTP 提供 dist/ 服务，而非直接打开 dist/index.html
npm start                  # http://localhost:8080
npm run preview            # npm run build，然后提供 dist/ 服务
```

### **文档与维护者说明**

| 文档 | 用途 |
|-----|------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | 添加转换器、工具、测试 |
| [docs/TOOL-SYSTEM.md](docs/TOOL-SYSTEM.md) | 工具模板、构建注入、共享 UI 类 |
| [build/README.md](build/README.md) | 各 `build:*` 脚本说明 |
| [templates/README.md](templates/README.md) | 编辑工具 HTML 模板 |

**保持 README 中转换列表同步：** 当你添加或重命名转换器时，在 `build/readme-transform-section.js` 的 `DESCRIPTIONS` 中添加一行描述，运行 `node build/readme-transform-section.js`，然后替换此处的**文本转换**部分（详见 [src/transformers/README.md](src/transformers/README.md)）。

## 🛠️ **技术细节**

### **架构**

- **前端**：Vue.js 2.6 + 现代 CSS（保持 Vue 2）
- **工具系统**：模块化工具注册，构建时模板注入
- **编码**：UTF-8，正确的 Unicode 处理
- **隐写术**：变体选择器和 Tags Unicode 块
- **转换器**：独立的转换器模块位于 `src/transformers/`（共 222 个；bundle 由 `npm run build:transforms` 生成）
- **构建流程**：
  - `npm run build` 将可运行的应用输出到 `dist/`（在大多数配置中被 git 忽略）
  - 转换器从 `src/transformers/` 打包到 `dist/js/bundles/transforms-bundle.js`
  - 工具模板从 `templates/` 注入到 `dist/index.html`
  - Emoji 数据生成到 `dist/js/data/`

### **浏览器支持**

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- 移动浏览器（iOS 13+、Android 8+）

### **性能**
- **实时处理**：大多数转换 < 16ms
- **内存高效**：流式处理大文本，无需全部加载到内存
- **优化渲染**：使用 Vue.js 高效更新 DOM

## 🔧 **近期修复与改进**

### **已修复**

- ✅ **重复转换器**：移除了重复的 `invisible_text` 转换
- ✅ **Base32 实现**：修复了编码/解码的字节处理
- ✅ **Unicode 支持**：改进了复杂 Unicode 字符的处理
- ✅ **逆向函数**：为许多转换器添加了缺失的逆向函数
- ✅ **Baudot / EBCDIC / YEnc 输出格式**：原实现输出包含大量控制字符（0x00–0x1F、0x80–0x9F），在文本 UI 中不可见且无法复制。现改为可显示格式——Baudot 输出 5 位二进制字符串、EBCDIC 和 YEnc 输出十六进制字节——编码映射逻辑不变，round-trip 完整可用

### **新功能**

- 🆕 **桌面应用 v0.2.8**：macOS 通用二进制（Apple Silicon + Intel）+ ad-hoc 签名；wails v2.16 与前后端依赖升级（详见 [CHANGELOG](CHANGELOG.md)）
- 🆕 **桌面应用 v0.2.7**：移植 [icesky](https://github.com/spindrifftapilio/icesky) 的 9 个工具——多模态文件注入（富文本/图像/音频/DOCX/PDF）、注入生成器、越狱提示词库、注入技术分类法、古风写作，工具总数 21 → 30
- 🆕 **桌面应用 v0.2.5**：多提供商 AI 架构（18+ 预设提供商）、Latin 词素分析、Emoji 隐写增强、i18n 补全
- 🆕 **AI 翻译**：翻译到 20+ 种语言（包括已消亡/珍稀语言），使用 TranslateGemma 提示格式
- 🆕 **PromptCraft 工具**：AI 驱动的提示词变异，支持 9 种策略和 48+ 模型
- 🆕 **222 种转换**：完整的编码、密码、Unicode 样式、奇幻与古代文字及技术代码目录
- 🆕 **更多编码/密码**：Base58、Base62、维吉尼亚、栅栏密码、罗马数字
- 🆕 **分类组织**：更好的转换分类
- 🆕 **增强样式**：每个分类的新配色方案
- 🆕 **改进的解码器**：更好的检测和回退机制

## 🌟 **使用场景**

### **创意写作**

- 为故事创造独特的文本风格
- 在普通文本中编码秘密消息
- 生成奇幻语言文本

### **教育**

- 学习不同的书写系统
- 研究密码学和编码
- 探索语言多样性

### **安全**

- 隐藏敏感信息
- 创建隐写消息
- 测试编码/解码系统

### **娱乐**

- 创建谜题和游戏
- 生成独特的用户名
- 为社交媒体帖子增添趣味

## 🤝 **贡献**

欢迎贡献！详见 **[CONTRIBUTING.md](CONTRIBUTING.md)**。

**快速入门：**

- **添加转换器？** 参见 `src/transformers/` 目录结构
- **添加新工具/功能？** 参见 `CONTRIBUTING.md` → "Adding a New Tool"
- **添加工具函数？** 参见 `CONTRIBUTING.md` → "Adding a New Utility Function"
- **编辑工具模板？** 参见 `templates/README.md`

**改进方向：**

- **新语言**：添加更多虚构或历史文字
- **更好的解码**：提高通用解码器准确率
- **性能**：优化超长文本处理
- **移动端**：增强移动体验
- **无障碍**：改进屏幕阅读器支持

## 📄 **许可证**

本项目为开源项目。详见 LICENSE 文件。

## 🙏 **致谢**

- **J.R.R. 托尔金** — 昆雅语和腾格瓦
- **星际迷航**创作者 — 克林贡语
- **星球大战**创作者 — Aurebesh
- **Bethesda** — Dovahzul 龙语
- **Unicode 联盟** — 字符标准

---

**P4RS3LT0NGV3** — 因为你有时需要说一些不存在的语言！🐉✨
