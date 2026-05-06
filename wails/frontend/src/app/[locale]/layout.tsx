import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/../routing'
import { Toaster } from 'sonner'
import { AppProvider } from '@/components/layout/AppProvider'
import en from '@/messages/en.json'
import zh from '@/messages/zh.json'

const messageMap: Record<string, Record<string, unknown>> = { en, zh }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = messageMap[locale] || messageMap[routing.defaultLocale]

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AppProvider>
        {children}
        <Toaster />
      </AppProvider>
    </NextIntlClientProvider>
  )
}
