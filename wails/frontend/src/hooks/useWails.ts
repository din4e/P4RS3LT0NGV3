// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'

function detectWails(): boolean {
  return typeof window !== 'undefined' && !!(window as any).runtime
}

async function loadWailsRuntime(): Promise<any> {
  const p = ['../', 'wailsjs/runtime/runtime'].join('')
  return import(/* webpackIgnore: true */ /* @vite-ignore */ p)
}

export function useWails() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [platform, setPlatform] = useState<string | undefined>(undefined)

  useEffect(() => {
    setIsDesktop(detectWails())
    if (detectWails()) {
      loadWailsRuntime()
        .then((rt) => rt.Environment())
        .then((env) => { if (env?.platform) setPlatform(env.platform) })
        .catch(() => {})
    }
  }, [])

  const minimize = useCallback(async () => {
    if (!isDesktop) return
    try { (await loadWailsRuntime()).WindowMinimise() } catch {}
  }, [isDesktop])

  const maximise = useCallback(async () => {
    if (!isDesktop) return
    try { (await loadWailsRuntime()).WindowToggleMaximise() } catch {}
  }, [isDesktop])

  const close = useCallback(async () => {
    if (!isDesktop) return
    try { (await loadWailsRuntime()).Quit() } catch {}
  }, [isDesktop])

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (isDesktop) {
      try { return await (await loadWailsRuntime()).ClipboardSetText(text) } catch {}
    }
    try { await navigator.clipboard.writeText(text); return true } catch { return false }
  }, [isDesktop])

  const readClipboard = useCallback(async (): Promise<string> => {
    if (isDesktop) {
      try { return await (await loadWailsRuntime()).ClipboardGetText() } catch {}
    }
    try { return await navigator.clipboard.readText() } catch { return '' }
  }, [isDesktop])

  return { isDesktop, platform, minimize, maximise, close, copyToClipboard, readClipboard }
}
