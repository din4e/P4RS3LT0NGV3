'use client'

import { useEffect } from 'react'

const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'es', 'fr', 'de']
const DEFAULT_LOCALE = 'en'

function detectUserLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  // Get browser language (e.g., "zh-CN", "zh-TW", "en-US", "ja")
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage

  if (!browserLang) return DEFAULT_LOCALE

  // Try exact match first (e.g., "zh-CN" -> check if "zh-CN" is supported)
  if (SUPPORTED_LOCALES.includes(browserLang)) {
    return browserLang
  }

  // Try language code only (e.g., "zh-CN" -> "zh", "en-US" -> "en")
  const langCode = browserLang.split('-')[0].toLowerCase()
  if (SUPPORTED_LOCALES.includes(langCode)) {
    return langCode
  }

  return DEFAULT_LOCALE
}

export default function RootPage() {
  useEffect(() => {
    const locale = detectUserLocale()
    window.location.replace(`/${locale}/`)
  }, [])
  return null
}
