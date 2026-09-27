/**
 * StyleCraft engine — local ancient-Chinese (古风) text rewriting.
 *
 * Ported from icesky (js/tools/StyleCraftTool.js). Produces wenyan-style or
 * poetry-style rewrites of Chinese input text entirely offline: vocabulary
 * replacement, sentence splitting, imagery injection and candidate generation
 * with fidelity/style metrics. Locked terms are protected from rewriting.
 */

// ---------------------------------------------------------------------------
// Option metadata
// ---------------------------------------------------------------------------

export interface StyleOption {
  id: string
  title: string
  desc: string
}

export const SC_USE_CASES: StyleOption[] = [
  { id: 'general', title: '通用改写', desc: '适合普通句子、通知和说明。' },
  { id: 'title', title: '标题题签', desc: '更短、更凝练，适合标题和题签。' },
  { id: 'narrative', title: '叙事纪行', desc: '适合事件经过、人物经历和记叙。' },
  { id: 'lyric', title: '抒情写景', desc: '更适合情绪表达和景物描写。' },
  { id: 'speech', title: '祝辞致辞', desc: '适合祝福、寄语和场合发言。' },
]

export interface WenyanTemplate {
  id: string
  title: string
  hint: string
}

export const SC_WENYAN: WenyanTemplate[] = [
  { id: 'balanced', title: '平衡文言', hint: '保真优先，古意适中。' },
  { id: 'chronicle', title: '纪述笔法', hint: '偏记事，适合叙事和过程。' },
  { id: 'xiaopin', title: '小品清语', hint: '更轻灵，适合抒情和题签。' },
]

export const SC_POETRY: WenyanTemplate[] = [
  { id: 'freeverse', title: '自由古风', hint: '短句分行，最稳妥。' },
  { id: 'quatrain', title: '绝句短章', hint: '四行收束，适合海报和金句。' },
  { id: 'regulated', title: '排比长章', hint: '八行展开，适合情绪铺陈。' },
]

/** Modern → classical vocabulary replacements. */
const SC_REPL: Array<[string, string]> = [
  ['我们', '吾辈'],
  ['你', '君'],
  ['他们', '其人'],
  ['因为', '缘'],
  ['所以', '故'],
  ['但是', '然'],
  ['如果', '若'],
  ['已经', '已'],
  ['需要', '需'],
  ['可以', '可'],
  ['应该', '宜'],
  ['然后', '乃'],
  ['现在', '今'],
  ['今天', '今朝'],
  ['昨天', '昨夕'],
  ['很多', '颇多'],
  ['事情', '其事'],
  ['问题', '所疑'],
  ['朋友', '故人'],
  ['城市', '城中'],
  ['世界', '天下'],
  ['风景', '景'],
  ['灯光', '灯影'],
  ['月光', '月色'],
]

/** Classical imagery words injected into poetry candidates. */
const SC_IMAGERY = [
  '清风', '明月', '灯影', '远山', '疏雨', '薄雾', '长街', '晚钟', '旧梦', '归舟',
]

export type StyleCraftMode = 'wenyan' | 'poetry'
export type PoetryForm = 'freeverse' | 'quatrain' | 'regulated'

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Normalize whitespace: collapse runs, cap blank lines. */
export function scNorm(text: string): string {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Split text into sentence then clause fragments. */
export function scSplit(text: string): string[] {
  return scNorm(text)
    .split(/(?<=[。！？!?；;\n])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) =>
      s
        .split(/(?<=[，、,])/)
        .map((c) => c.trim())
        .filter(Boolean),
    )
}

/** Trim leading/trailing punctuation and whitespace. */
export function scTrim(text: string): string {
  return String(text || '').replace(/^[，。！？、；：\s]+|[，。！？、；：\s]+$/g, '')
}

/** Stable string hash (0..1000003). */
function scHash(text: string): number {
  return Array.from(String(text || '')).reduce(
    (acc, ch) => (131 * acc + ch.charCodeAt(0)) % 1000003,
    0,
  )
}

// ---------------------------------------------------------------------------
// Locked-term protection
// ---------------------------------------------------------------------------

export interface TermLock {
  token: string
  term: string
}

export interface ProtectedText {
  text: string
  locks: TermLock[]
}

/** Replace each locked term with a placeholder so rewriting skips it. */
export function scProtect(text: string, lockedTerms: string[]): ProtectedText {
  let out = String(text || '')
  const locks: TermLock[] = []
  Array.from(
    new Set((lockedTerms || []).map((t) => String(t || '').trim()).filter(Boolean)),
  )
    .sort((a, b) => b.length - a.length)
    .forEach((term, i) => {
      const token = `__SCLOCK_${i}__`
      out = out.split(term).join(token)
      locks.push({ token, term })
    })
  return { text: out, locks }
}

/** Restore locked terms from their placeholders. */
export function scRestore(text: string, locks: TermLock[]): string {
  return (locks || []).reduce((acc, lock) => acc.split(lock.token).join(lock.term), String(text || ''))
}

// ---------------------------------------------------------------------------
// Core rewriting
// ---------------------------------------------------------------------------

/**
 * Apply classical vocabulary and particles at the given style level (1-3).
 * Level 1 applies only every third replacement rule (most conservative).
 */
export function scClassicalize(text: string, level: number): string {
  let out = String(text || '')
  SC_REPL.forEach(([modern, classical], i) => {
    if (level === 1 && i % 3 === 0) return
    out = out.split(modern).join(classical)
  })
  return out
    .replace(/的/g, level >= 3 ? '之' : '的')
    .replace(/了/g, level >= 2 ? '' : '了')
    .replace(/吗/g, '乎')
    .replace(/呢|吧|啊/g, '')
    .replace(/,|，/g, '，')
    .replace(/;|；/g, '；')
    .replace(/\s+/g, '')
    .replace(/，{2,}/g, '，')
    .replace(/；{2,}/g, '；')
}

// ---------------------------------------------------------------------------
// Metrics & candidates
// ---------------------------------------------------------------------------

export interface StyleMetrics {
  fidelity: number
  style: number
  protectedTerms: string
}

export interface StyleCandidate {
  title: string
  note: string
  text: string
  metrics: StyleMetrics
}

export interface CandidateOptions {
  mode: StyleCraftMode
  useCase: string
  wenyanTemplate: string
  poetryTemplate: string
  poetryForm: PoetryForm
  styleLevel: number
  lockedTerms: string[]
}

function buildMetrics(
  input: string,
  output: string,
  candidateIndex: number,
  opts: CandidateOptions,
): StyleMetrics {
  const inputLen = Math.max(1, scNorm(input || '').length)
  const outputLen = Math.max(1, String(output || '').length)
  const lengthDelta = Math.min(100, Math.round((Math.abs(outputLen - inputLen) / inputLen) * 100))
  const lostTerms = opts.lockedTerms.filter(
    (term) => term && !String(output || '').includes(term),
  ).length
  const totalTerms = opts.lockedTerms.length
  return {
    fidelity: Math.max(62, 96 - lengthDelta - 8 * lostTerms + (candidateIndex === 0 ? 4 : 0)),
    style: Math.min(
      98,
      58 + 10 * opts.styleLevel + 7 * candidateIndex + (opts.mode === 'poetry' ? 6 : 0),
    ),
    protectedTerms: totalTerms ? `${totalTerms - lostTerms}/${totalTerms}` : '',
  }
}

/** Generate three wenyan-style candidates (conservative / recommended / bolder). */
export function buildWenyanCandidates(input: string, opts: CandidateOptions): StyleCandidate[] {
  const fragments = scSplit(input)
  const variants = [
    { level: Math.max(1, opts.styleLevel - 1), template: 'balanced', note: 'candidateSafe' },
    { level: opts.styleLevel, template: opts.wenyanTemplate, note: 'candidateRecommended' },
    {
      level: Math.min(3, opts.styleLevel + 1),
      template: opts.wenyanTemplate === 'balanced' ? 'xiaopin' : opts.wenyanTemplate,
      note: 'candidateBolder',
    },
  ]
  return variants.map((variant, i) => {
    const protectedText = scProtect(fragments.join(' '), opts.lockedTerms)
    const rewritten = scSplit(protectedText.text)
      .map((fragment) => {
        const classical = scTrim(scClassicalize(fragment, variant.level))
        if (!classical) return ''
        const imagery = SC_IMAGERY[(scHash(classical) + i) % SC_IMAGERY.length]
        let line = classical
        if (variant.template === 'chronicle') {
          line = `${i === 0 ? '其事略曰：' : i === 1 ? '按其事：' : '其后，'}${classical}`
        } else if (variant.template === 'xiaopin') {
          line = `${i === 2 ? `临${imagery}而记：` : '是以记之：'}${classical}`
        } else if (opts.useCase === 'speech') {
          line = `${i === 0 ? '愿' : '谨'}${classical}`
        }
        return scTrim(line) + '。'
      })
      .filter(Boolean)
      .join('')
    const text = scRestore(rewritten, protectedText.locks)
      .replace(/。{2,}/g, '。')
      .replace(/；。/g, '。')
    return {
      title: `candidate${i + 1}`,
      note: variant.note,
      text: text || scClassicalize(input, variant.level),
      metrics: buildMetrics(input, text || input, i, opts),
    }
  })
}

/** Generate three poetry-style candidates (faithful / recommended / imagery). */
export function buildPoetryCandidates(input: string, opts: CandidateOptions): StyleCandidate[] {
  const lineCount =
    opts.poetryForm === 'regulated' ? 8 : opts.poetryForm === 'quatrain' ? 4 : 5
  return [0, 1, 2].map((candidateIndex) => {
    const protectedText = scProtect(input, opts.lockedTerms)
    const fragments = scSplit(protectedText.text)
      .map((fragment) =>
        scTrim(
          scClassicalize(
            fragment,
            Math.min(3, opts.styleLevel + (candidateIndex === 2 ? 1 : 0)),
          ),
        ),
      )
      .filter(Boolean)
    const source = fragments.length
      ? fragments
      : [scTrim(scClassicalize(protectedText.text, opts.styleLevel))]
    const poem = Array.from({ length: lineCount }, (_, lineIndex) => {
      const fragment = source[lineIndex % source.length] || ''
      const imagery = SC_IMAGERY[(scHash(fragment) + lineIndex + candidateIndex) % SC_IMAGERY.length]
      let line = fragment
      if (opts.poetryTemplate === 'quatrain') {
        line = lineIndex % 2 === 0 ? `${imagery}${fragment}` : `${fragment}${imagery}`
      } else if (opts.poetryTemplate === 'regulated') {
        line = lineIndex % 2 === 0 ? `向${imagery}而望，${fragment}` : `念及${imagery}，${fragment}`
      } else if (candidateIndex === 2) {
        line = `${imagery}未歇，${fragment}`
      }
      return scRestore(
        scTrim(line)
          .replace(/，{2,}/g, '，')
          .replace(/。+/g, '')
          .replace(/；+/g, '，'),
        protectedText.locks,
      )
    }).join('\n')
    return {
      title: `candidate${candidateIndex + 1}`,
      note: candidateIndex === 0 ? 'candidateFaithful' : candidateIndex === 1 ? 'candidateRecommended' : 'candidateImagery',
      text: poem,
      metrics: buildMetrics(input, poem, candidateIndex, opts),
    }
  })
}

/** Generate three candidates for the configured mode. */
export function generateCandidates(input: string, opts: CandidateOptions): StyleCandidate[] {
  const text = scNorm(input || '')
  if (!text) return []
  return opts.mode === 'poetry'
    ? buildPoetryCandidates(text, opts)
    : buildWenyanCandidates(text, opts)
}

// ---------------------------------------------------------------------------
// Locked-term suggestion
// ---------------------------------------------------------------------------

/**
 * Suggest terms to lock (protect from rewriting): quoted spans, dates,
 * Latin identifiers, org/place names and quantities found in the input.
 */
export function suggestLockedTerms(input: string): string[] {
  const text = scNorm(input || '')
  const found = new Set<string>()
  const push = (term: string) => {
    const trimmed = String(term || '').trim()
    if (trimmed && trimmed.length <= 32) found.add(trimmed)
  }
  ;(text.match(/[“"]([^“”"\n]{2,24})[”"]/g) || []).forEach((m) => push(m.slice(1, -1)))
  ;(text.match(/\d{1,4}[-/:年]\d{1,2}[-/:月]\d{1,2}[日号]?/g) || []).forEach(push)
  ;(text.match(/\b[A-Za-z][A-Za-z0-9_./:+#-]{1,}\b/g) || []).forEach(push)
  ;(
    text.match(
      /[一-鿿]{2,8}(?:公司|集团|大学|学院|项目|平台|系统|会议|机场|景区|公园|博物馆|医院|学校)/g,
    ) || []
  ).forEach(push)
  ;(text.match(/[一-鿿]{2,5}(?:省|市|区|县|镇|乡|村|路|街|站)/g) || []).forEach(push)
  ;(
    text.match(/\d+(?:\.\d+)?(?:%|℃|元|人|次|天|小时|分钟|秒|公里|米|万|亿)?/g) || []
  ).forEach(push)
  return Array.from(found).slice(0, 12)
}

/** Parse a user-entered locked-terms string (separated by newline/comma/etc.). */
export function parseLockedTerms(input: string): string[] {
  return String(input || '')
    .split(/[\n,，、;；]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 24)
}
