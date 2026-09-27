/**
 * DOCX (OOXML) injection sample builder.
 *
 * Ported from IceSky DocxInjectTool: builds Word documents whose payload
 * text is spread across layers an LLM document parser may pick up —
 * body runs, hidden (vanish) runs, comments, headers/footers and core
 * metadata — for testing indirect prompt injection through DOCX files.
 *
 * ZIP packaging is handled by the dependency-free `docxZip` module.
 */

import {
  buildZip,
  buildTextZip,
  readZipEntries,
  readZipText,
  utf8Bytes,
  type ZipRawEntry,
} from './docxZip'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DOCX_INJECT_UPLOAD_MAX_BYTES = 12582912
export const DOCX_INJECT_UPLOAD_EXTENSIONS = Object.freeze(['.docx'])
export const DOCX_INJECT_UPLOAD_MIMES = Object.freeze([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/octet-stream',
])

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Injection configuration mirroring the IceSky tool form state. */
export interface DocxInjectConfig {
  visibleText: string
  hiddenText: string
  commentAnchorText: string
  commentText: string
  headerText: string
  footerText: string
  metaTitle: string
  metaSubject: string
  metaKeywords: string
  metaDescription: string
  metaCreator: string
  hiddenEnabled: boolean
  commentEnabled: boolean
  headerEnabled: boolean
  footerEnabled: boolean
  metaEnabled: boolean
}

/** Labels used when assembling the merged "expected read" text. */
export interface DocxExpectedLabels {
  hidden: string
  comment: string
  header: string
  footer: string
  meta: string
}

export const DEFAULT_EXPECTED_LABELS: DocxExpectedLabels = {
  hidden: '[隐藏文字]',
  comment: '[批注]',
  header: '[页眉]',
  footer: '[页脚]',
  meta: '[元数据]',
}

/** A generated sample plus the XML previews shown in the UI. */
export interface DocxInjectResult {
  blob: Blob
  documentXml: string
  commentsXml: string
  coreXml: string
  /** Body text actually present in the sample (extracted when uploading). */
  bodyText: string
}

/** An uploaded DOCX kept in memory for re-injection. */
export interface DocxInjectUpload {
  name: string
  /** Byte length of `bytes`. */
  size: number
  bytes: ArrayBuffer
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/** Escape text for safe inclusion in XML character data / attributes. */
export function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Decode XML character entities back to plain text. */
export function decodeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/** Collapse whitespace and truncate for one-line preview rows. */
export function short(value: unknown, max = 88, fallback = '未设置'): string {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return fallback
  return text.length > max ? `${text.slice(0, max - 3)}...` : text
}

/** Lower-cased file extension including the dot, e.g. `.docx`. */
export function getExtension(name: string): string {
  const match = String(name || '')
    .toLowerCase()
    .match(/\.[a-z0-9]+$/)
  return match ? match[0] : ''
}

/** Strip the extension from a filename for output naming. */
export function stem(name: string): string {
  return String(name || 'docx-inject').replace(/\.[^.]+$/, '') || 'docx-inject'
}

/** Trigger a browser download for a blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1200)
}

// ---------------------------------------------------------------------------
// OOXML part builders
// ---------------------------------------------------------------------------

/** A `<w:p>` paragraph, optionally hidden through a vanish run property. */
export function paragraph(text: string, options: { hidden?: boolean } = {}): string {
  const escaped = escapeXml(text)
  const rPr = options.hidden ? '<w:rPr><w:vanish/></w:rPr>' : ''
  return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`
}

/** A body paragraph whose range is wrapped by a comment anchor. */
export function commentAnchor(text: string, commentId: number): string {
  const escaped = escapeXml(text || '批注锚点')
  return `<w:p><w:commentRangeStart w:id="${commentId}"/><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r><w:commentRangeEnd w:id="${commentId}"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="${commentId}"/></w:r></w:p>`
}

/** A fresh `word/comments.xml` containing a single comment. */
export function commentsXml(text: string, commentId = 0): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:comment w:id="${commentId}" w:author="冰霄 IceSky" w:initials="IS" w:date="${new Date().toISOString()}">\n    <w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>\n  </w:comment>\n</w:comments>`
}

/** Append a comment to an existing `word/comments.xml` (or create one). */
export function appendCommentXml(existing: string, text: string, commentId: number): string {
  const node = `  <w:comment w:id="${commentId}" w:author="冰霄 IceSky" w:initials="IS" w:date="${new Date().toISOString()}">\n    <w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>\n  </w:comment>`
  if (existing && /<w:comments\b/.test(existing)) {
    if (existing.includes(`w:id="${commentId}"`)) return existing
    return existing.replace(/<\/w:comments>/, `${node}\n</w:comments>`)
  }
  return commentsXml(text, commentId)
}

/** Next free comment id in a `word/comments.xml` document. */
export function nextCommentId(commentsXmlDoc: string): number {
  const ids: number[] = []
  const pattern = /<w:comment\b[^>]*w:id="(\d+)"/g
  let match = pattern.exec(commentsXmlDoc || '')
  while (match) {
    ids.push(Number(match[1]))
    match = pattern.exec(commentsXmlDoc || '')
  }
  return ids.length ? Math.max(...ids) + 1 : 0
}

/** A one-paragraph `word/headerInject.xml`. */
export function headerXml(text: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>\n</w:hdr>`
}

/** A one-paragraph `word/footerInject.xml`. */
export function footerXml(text: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>\n</w:ftr>`
}

/** Minimal `word/styles.xml` including the CommentReference style. */
export function stylesXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">\n    <w:name w:val="Normal"/>\n    <w:qFormat/>\n  </w:style>\n  <w:style w:type="character" w:styleId="CommentReference">\n    <w:name w:val="Comment Reference"/>\n  </w:style>\n</w:styles>'
}

/** Ensure `word/styles.xml` defines the CommentReference character style. */
export function ensureCommentReferenceStyle(existing: string): string {
  if (!existing || !/<w:styles\b/.test(existing)) return stylesXml()
  if (existing.includes('w:styleId="CommentReference"')) return existing
  return existing.replace(
    /<\/w:styles>/,
    '  <w:style w:type="character" w:styleId="CommentReference">\n    <w:name w:val="Comment Reference"/>\n  </w:style>\n</w:styles>',
  )
}

interface CoreProps {
  title: string
  subject: string
  keywords: string
  description: string
  creator: string
}

/** `docProps/core.xml` carrying the injected metadata fields. */
export function coreXml(props: CoreProps): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"\n    xmlns:dc="http://purl.org/dc/elements/1.1/"\n    xmlns:dcterms="http://purl.org/dc/terms/"\n    xmlns:dcmitype="http://purl.org/dc/dcmitype/"\n    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <dc:title>${escapeXml(props.title)}</dc:title>\n  <dc:subject>${escapeXml(props.subject)}</dc:subject>\n  <dc:creator>${escapeXml(props.creator)}</dc:creator>\n  <cp:keywords>${escapeXml(props.keywords)}</cp:keywords>\n  <dc:description>${escapeXml(props.description)}</dc:description>\n  <cp:lastModifiedBy>冰霄 IceSky</cp:lastModifiedBy>\n  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>\n  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>\n</cp:coreProperties>`
}

/** Static `docProps/app.xml`. */
export function appXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"\n    xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n  <Application>IceSky DOCX Inject</Application>\n  <DocSecurity>0</DocSecurity>\n  <ScaleCrop>false</ScaleCrop>\n  <Company>冰霄 IceSky</Company>\n  <LinksUpToDate>false</LinksUpToDate>\n  <SharedDoc>false</SharedDoc>\n  <HyperlinksChanged>false</HyperlinksChanged>\n  <AppVersion>1.0</AppVersion>\n</Properties>'
}

/** Package-level `_rels/.rels`. */
export function rootRels(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>\n  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>\n</Relationships>'
}

/** `word/_rels/document.xml.rels` for a freshly built document. */
export function documentRels(config: DocxInjectConfig): string {
  const rels = [
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
  ]
  if (config.headerEnabled) {
    rels.push(
      '<Relationship Id="rIdInjectHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="headerInject.xml"/>',
    )
  }
  if (config.footerEnabled) {
    rels.push(
      '<Relationship Id="rIdInjectFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footerInject.xml"/>',
    )
  }
  if (config.commentEnabled) {
    rels.push(
      '<Relationship Id="rIdInjectComments" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>',
    )
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  ${rels.join('\n  ')}\n</Relationships>`
}

/** `[Content_Types].xml` for a freshly built document. */
export function contentTypes(config: DocxInjectConfig): string {
  const overrides = [
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
  ]
  if (config.headerEnabled) {
    overrides.push(
      '<Override PartName="/word/headerInject.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>',
    )
  }
  if (config.footerEnabled) {
    overrides.push(
      '<Override PartName="/word/footerInject.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>',
    )
  }
  if (config.commentEnabled) {
    overrides.push(
      '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>',
    )
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  ${overrides.join('\n  ')}\n</Types>`
}

/** `<w:sectPr>` wiring header/footer references and page metrics. */
export function buildSectPr(config: DocxInjectConfig): string {
  const refs: string[] = []
  if (config.headerEnabled) {
    refs.push('<w:headerReference w:type="default" r:id="rIdInjectHeader"/>')
  }
  if (config.footerEnabled) {
    refs.push('<w:footerReference w:type="default" r:id="rIdInjectFooter"/>')
  }
  return `<w:sectPr>${refs.join('')}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>`
}

/** Full `word/document.xml` for a freshly built document. */
export function documentXml(config: DocxInjectConfig, options: { commentId?: number } = {}): string {
  const parts = [
    paragraph(config.visibleText),
    config.hiddenEnabled && config.hiddenText
      ? paragraph(config.hiddenText, { hidden: true })
      : '',
    config.commentEnabled && config.commentText
      ? commentAnchor(config.commentAnchorText, options.commentId || 0)
      : '',
  ].filter(Boolean)
  parts.push(buildSectPr(config))
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"\n    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"\n    xmlns:o="urn:schemas-microsoft-com:office:office"\n    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"\n    xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"\n    xmlns:v="urn:schemas-microsoft-com:vml"\n    xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"\n    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"\n    xmlns:w10="urn:schemas-microsoft-com:office:word"\n    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"\n    xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"\n    xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"\n    xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"\n    xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"\n    xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"\n    mc:Ignorable="w14 wp14">\n  <w:body>\n    ${parts.join('\n    ')}\n  </w:body>\n</w:document>`
}

// ---------------------------------------------------------------------------
// XML patching helpers (uploaded documents)
// ---------------------------------------------------------------------------

/** Ensure `[Content_Types].xml` declares an override for a part. */
export function ensureContentType(existing: string, partName: string, contentType: string): string {
  const override = `<Override PartName="${partName}" ContentType="${contentType}"/>`
  if (existing && /<Types\b/.test(existing)) {
    if (existing.includes(`PartName="${partName}"`)) return existing
    return existing.replace(/<\/Types>/, `  ${override}\n</Types>`)
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  ${override}\n</Types>`
}

/** Ensure a `.rels` document declares a relationship. */
export function ensureRelationship(
  existing: string,
  id: string,
  type: string,
  target: string,
): string {
  const rel = `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`
  if (existing && /<Relationships\b/.test(existing)) {
    if (existing.includes(`Target="${target}"`)) return existing
    return existing.replace(/<\/Relationships>/, `  ${rel}\n</Relationships>`)
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  ${rel}\n</Relationships>`
}

/** Concatenate all `<w:t>` runs of a `word/document.xml` body. */
export function extractBodyText(documentXmlDoc: string): string {
  const parts: string[] = []
  const pattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g
  let match = pattern.exec(documentXmlDoc || '')
  while (match) {
    parts.push(decodeXml(match[1]))
    match = pattern.exec(documentXmlDoc || '')
  }
  return parts
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Ensure the final `<w:sectPr>` carries the injected header/footer refs. */
export function ensureSectionRefs(documentXmlDoc: string, config: DocxInjectConfig): string {
  let doc = String(documentXmlDoc || '')
  const lastSectPr =
    /<w:sectPr\b[^>]*(?:\/>|>(?:(?!<w:sectPr\b)[\s\S])*?<\/w:sectPr>)(?![\s\S]*<w:sectPr\b)/
  const headerRef = '<w:headerReference w:type="default" r:id="rIdInjectHeader"/>'
  const footerRef = '<w:footerReference w:type="default" r:id="rIdInjectFooter"/>'
  if (lastSectPr.test(doc)) {
    return doc.replace(lastSectPr, (sectPr) => {
      let patched = sectPr.replace(/\s*\/>$/, '></w:sectPr>')
      if (config.headerEnabled) {
        if (/<w:headerReference\b[^>]*w:type="default"[^>]*\/>/.test(patched)) {
          patched = patched.replace(
            /<w:headerReference\b[^>]*w:type="default"[^>]*\/>/,
            headerRef,
          )
        } else if (!patched.includes(headerRef)) {
          patched = patched.replace(/<w:sectPr\b([^>]*)>/, `<w:sectPr$1>${headerRef}`)
        }
      }
      if (config.footerEnabled) {
        if (/<w:footerReference\b[^>]*w:type="default"[^>]*\/>/.test(patched)) {
          patched = patched.replace(
            /<w:footerReference\b[^>]*w:type="default"[^>]*\/>/,
            footerRef,
          )
        } else if (!patched.includes(footerRef)) {
          patched = patched.replace(/<w:sectPr\b([^>]*)>/, `<w:sectPr$1>${footerRef}`)
        }
      }
      return patched
    })
  }
  return doc.replace(/<\/w:body>/, `${buildSectPr(config)}</w:body>`)
}

/** Splice hidden runs and comment anchors into an uploaded `word/document.xml`. */
export function injectIntoDocumentXml(
  documentXmlDoc: string,
  config: DocxInjectConfig,
  options: { commentId?: number } = {},
): string {
  if (!documentXmlDoc || !/<w:document\b/.test(documentXmlDoc) || !/<w:body\b/.test(documentXmlDoc)) {
    return documentXml(config, options)
  }
  let doc = String(documentXmlDoc)
  const injections: string[] = []
  if (config.hiddenEnabled && config.hiddenText) {
    injections.push(paragraph(config.hiddenText, { hidden: true }))
  }
  if (config.commentEnabled && config.commentText) {
    injections.push(commentAnchor(config.commentAnchorText, options.commentId || 0))
  }
  const injection = injections.join('')
  if (injection) {
    if (/<w:sectPr\b/.test(doc)) {
      doc = doc.replace(
        /<w:sectPr\b[^>]*(?:\/>|>(?:(?!<w:sectPr\b)[\s\S])*?<\/w:sectPr>)(?![\s\S]*<w:sectPr\b)/,
        (sectPr) => `${injection}${sectPr}`,
      )
    } else {
      doc = doc.replace(/<\/w:body>/, `${injection}${buildSectPr(config)}</w:body>`)
    }
  }
  if (config.headerEnabled || config.footerEnabled) {
    doc = ensureSectionRefs(doc, config)
  }
  return doc
}

// ---------------------------------------------------------------------------
// Expected merged output
// ---------------------------------------------------------------------------

/**
 * Merge every injected layer into the text a naive extractor would read,
 * mirroring how document-parsing pipelines flatten a DOCX.
 */
export function expectedText(
  config: DocxInjectConfig,
  bodyText?: string,
  labels: DocxExpectedLabels = DEFAULT_EXPECTED_LABELS,
): string {
  const lines = [String(bodyText || config.visibleText || '').trim()].filter(Boolean)
  if (config.hiddenEnabled && config.hiddenText) lines.push(`${labels.hidden} ${config.hiddenText}`)
  if (config.commentEnabled && config.commentText) lines.push(`${labels.comment} ${config.commentText}`)
  if (config.headerEnabled && config.headerText) lines.push(`${labels.header} ${config.headerText}`)
  if (config.footerEnabled && config.footerText) lines.push(`${labels.footer} ${config.footerText}`)
  if (config.metaEnabled) {
    ;[config.metaTitle, config.metaSubject, config.metaKeywords, config.metaDescription]
      .filter(Boolean)
      .forEach((value) => lines.push(`${labels.meta} ${value}`))
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// High-level builders
// ---------------------------------------------------------------------------

const CORE_PROPS = (config: DocxInjectConfig): CoreProps => ({
  title: config.metaTitle,
  subject: config.metaSubject,
  keywords: config.metaKeywords,
  description: config.metaDescription,
  creator: config.metaCreator,
})

/**
 * Build a fresh DOCX sample from scratch.
 */
export function buildNewDocx(config: DocxInjectConfig): DocxInjectResult {
  const doc = documentXml(config, { commentId: 0 })
  const comments = config.commentEnabled
    ? commentsXml(config.commentText || '未填写批注内容', 0)
    : ''
  const core = coreXml(CORE_PROPS(config))
  const app = appXml()

  const files: Record<string, string> = {
    '[Content_Types].xml': contentTypes(config),
    '_rels/.rels': rootRels(),
    'word/document.xml': doc,
    'word/styles.xml': stylesXml(),
    'word/_rels/document.xml.rels': documentRels(config),
  }
  if (config.headerEnabled) {
    files['word/headerInject.xml'] = headerXml(config.headerText || '未填写页眉')
  }
  if (config.footerEnabled) {
    files['word/footerInject.xml'] = footerXml(config.footerText || '未填写页脚')
  }
  if (config.commentEnabled) {
    files['word/comments.xml'] = comments
  }
  files['docProps/core.xml'] = core
  files['docProps/app.xml'] = app

  const blob = buildTextZip(files, DOCX_MIME)
  return { blob, documentXml: doc, commentsXml: comments, coreXml: core, bodyText: config.visibleText }
}

/**
 * Inject into an uploaded DOCX, preserving its body and every untouched part.
 *
 * Modified parts are rewritten as STORE entries; all other entries are
 * copied byte-for-byte with their original compression.
 */
export async function injectIntoUploadedDocx(
  upload: DocxInjectUpload,
  config: DocxInjectConfig,
): Promise<DocxInjectResult> {
  const entries: ZipRawEntry[] = readZipEntries(upload.bytes)
  if (!entries.some((entry) => entry.name === 'word/document.xml')) {
    throw new Error('Uploaded DOCX is missing word/document.xml')
  }

  const read = async (name: string, fallback = '') =>
    (await readZipText(entries, name)) ?? fallback

  let contentTypesDoc = await read('[Content_Types].xml')
  let rootRelsDoc = await read('_rels/.rels', rootRels())
  let documentRelsDoc = await read('word/_rels/document.xml.rels')

  let doc = await read('word/document.xml')
  if (!doc) throw new Error('Uploaded DOCX is missing word/document.xml')
  const bodyText = extractBodyText(doc) || config.visibleText

  const commentsDoc = await read('word/comments.xml')
  const stylesDoc = await read('word/styles.xml')
  const coreDoc = await read('docProps/core.xml')
  const appDoc = await read('docProps/app.xml')

  const commentId = config.commentEnabled && config.commentText ? nextCommentId(commentsDoc) : 0

  let commentsOut = ''
  doc = injectIntoDocumentXml(doc, config, { commentId })

  const replaced = new Map<string, string>([['word/document.xml', doc]])

  replaced.set('word/styles.xml', ensureCommentReferenceStyle(stylesDoc))
  documentRelsDoc = ensureRelationship(
    documentRelsDoc,
    'rIdStyles',
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
    'styles.xml',
  )
  contentTypesDoc = ensureContentType(
    contentTypesDoc,
    '/word/styles.xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml',
  )

  if (config.commentEnabled && config.commentText) {
    commentsOut = appendCommentXml(commentsDoc, config.commentText, commentId)
    replaced.set('word/comments.xml', commentsOut)
    documentRelsDoc = ensureRelationship(
      documentRelsDoc,
      'rIdInjectComments',
      'http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments',
      'comments.xml',
    )
    contentTypesDoc = ensureContentType(
      contentTypesDoc,
      '/word/comments.xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml',
    )
  } else {
    commentsOut = commentsDoc
  }

  if (config.headerEnabled && config.headerText) {
    replaced.set('word/headerInject.xml', headerXml(config.headerText))
    documentRelsDoc = ensureRelationship(
      documentRelsDoc,
      'rIdInjectHeader',
      'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header',
      'headerInject.xml',
    )
    contentTypesDoc = ensureContentType(
      contentTypesDoc,
      '/word/headerInject.xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml',
    )
  }

  if (config.footerEnabled && config.footerText) {
    replaced.set('word/footerInject.xml', footerXml(config.footerText))
    documentRelsDoc = ensureRelationship(
      documentRelsDoc,
      'rIdInjectFooter',
      'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer',
      'footerInject.xml',
    )
    contentTypesDoc = ensureContentType(
      contentTypesDoc,
      '/word/footerInject.xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml',
    )
  }

  const coreOut = config.metaEnabled
    ? coreXml(CORE_PROPS(config))
    : coreDoc || coreXml(CORE_PROPS(config))
  const appOut = appDoc || appXml()
  replaced.set('docProps/core.xml', coreOut)
  replaced.set('docProps/app.xml', appOut)

  rootRelsDoc = ensureRelationship(
    rootRelsDoc,
    'rId2',
    'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
    'docProps/core.xml',
  )
  rootRelsDoc = ensureRelationship(
    rootRelsDoc,
    'rId3',
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties',
    'docProps/app.xml',
  )
  contentTypesDoc = ensureContentType(
    contentTypesDoc,
    '/docProps/core.xml',
    'application/vnd.openxmlformats-package.core-properties+xml',
  )
  contentTypesDoc = ensureContentType(
    contentTypesDoc,
    '/docProps/app.xml',
    'application/vnd.openxmlformats-officedocument.extended-properties+xml',
  )

  replaced.set('[Content_Types].xml', contentTypesDoc)
  replaced.set('_rels/.rels', rootRelsDoc)
  replaced.set('word/_rels/document.xml.rels', documentRelsDoc)

  // Drop entries that will be re-added below (avoid duplicates).
  const passthrough = entries.filter((entry) => !replaced.has(entry.name))
  const blob = buildZip(
    [
      ...[...replaced.entries()].map(([name, content]) => ({
        name,
        data: utf8Bytes(content),
      })),
      ...passthrough.map((entry) => ({ name: entry.name, raw: entry })),
    ],
    DOCX_MIME,
  )

  return { blob, documentXml: doc, commentsXml: commentsOut, coreXml: coreOut, bodyText }
}

/**
 * Build the downloadable XML preview bundle
 * (document.xml / core.xml / comments.xml / expected.txt).
 */
export function buildXmlBundle(files: Record<string, string>): Blob {
  return buildTextZip(files, 'application/zip')
}
