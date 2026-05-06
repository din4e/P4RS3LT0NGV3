import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { TabBar } from '@/components/layout/TabBar'
import { ToolPanel } from '@/components/layout/ToolPanel'
import { CopyHistoryPanel } from '@/components/layout/CopyHistoryPanel'
import { AdvancedSettingsPanel } from '@/components/layout/AdvancedSettingsPanel'
import { ClientShortcuts } from '@/components/layout/ClientInitializer'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ClientShortcuts />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <TabBar />
          <ToolPanel />
        </main>
        <CopyHistoryPanel />
        <AdvancedSettingsPanel />
      </div>
    </div>
  )
}
