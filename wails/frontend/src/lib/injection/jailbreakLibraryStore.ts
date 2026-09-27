/**
 * Local draft persistence for the jailbreak library tool.
 *
 * User edits to library entries are kept as per-entry text overrides in
 * localStorage so drafts survive tab switches and app restarts. icesky kept
 * drafts in memory only; persisting them locally is a small usability upgrade
 * on the same behaviour.
 */

const DRAFTS_KEY = 'jailbreak-library-drafts'

export type JailbreakDrafts = Record<string, string>

function safeRead(): string | null {
  try {
    return localStorage.getItem(DRAFTS_KEY)
  } catch {
    return null
  }
}

function safeWrite(value: string): void {
  try {
    localStorage.setItem(DRAFTS_KEY, value)
  } catch {
    /* ignore quota errors */
  }
}

/** Load all persisted drafts (empty when none). */
export function loadDrafts(): JailbreakDrafts {
  const raw = safeRead()
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as JailbreakDrafts
    }
  } catch {
    /* corrupted store — start fresh */
  }
  return {}
}

/** Persist the full drafts map. */
export function saveDrafts(drafts: JailbreakDrafts): void {
  safeWrite(JSON.stringify(drafts))
}

/** Drop the draft for one entry (after restoring the original text). */
export function clearDraft(drafts: JailbreakDrafts, id: string): JailbreakDrafts {
  const next = { ...drafts }
  delete next[id]
  saveDrafts(next)
  return next
}

/** Insert or replace a draft and persist. */
export function upsertDraft(drafts: JailbreakDrafts, id: string, text: string): JailbreakDrafts {
  const next = { ...drafts, [id]: text }
  saveDrafts(next)
  return next
}
