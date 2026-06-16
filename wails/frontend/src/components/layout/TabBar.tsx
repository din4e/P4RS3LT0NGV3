'use client'

import { useTranslations } from 'next-intl'
import {
  Type,
  KeyRound,
  Smile,
  Bomb,
  Bug,
  Layers,
  ArrowLeftRight,
  Grip,
  Split,
  Braces,
  MessageCircle,
  WandSparkles,
  Languages,
  Bot,
  Scroll,
  ShieldCheck,
  GitBranch,
  MessagesSquare,
  Search,
  BarChart3,
  Drill,
  Dna,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore, TOOL_CONFIGS, type ToolConfig } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  Type,
  KeyRound,
  Smile,
  Bomb,
  Bug,
  Layers,
  ArrowLeftRight,
  Grip,
  Split,
  Braces,
  MessageCircle,
  WandSparkles,
  Languages,
  Bot,
  Scroll,
  ShieldCheck,
  GitBranch,
  MessagesSquare,
  Search,
  BarChart3,
  Drill,
  Dna,
}

export function TabBar() {
  const t = useTranslations('tools')
  const activeTab = useAppStore((s) => s.activeTab)
  const switchTab = useAppStore((s) => s.switchTab)

  return (
    <nav
      role="tablist"
      aria-label="Tool navigation"
      className={cn(
        'flex shrink-0 items-center gap-0.5 px-2 py-1',
        'overflow-x-auto',
        'border-b',
        'scrollbar-thin scrollbar-thumb-[var(--muted)]',
      )}
      style={{ borderBottomColor: 'var(--border)' }}
    >
      {TOOL_CONFIGS.map((tool) => (
        <TabButton
          key={tool.id}
          tool={tool}
          label={t(tool.nameKey)}
          isActive={activeTab === tool.id}
          onClick={() => switchTab(tool.id)}
        />
      ))}
    </nav>
  )
}

function TabButton({
  tool,
  label,
  isActive,
  onClick,
}: {
  tool: ToolConfig
  label: string
  isActive: boolean
  onClick: () => void
}) {
  const IconComponent = ICON_MAP[tool.icon]

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      title={`${label} (${tool.shortcut})`}
      className={cn(
        'relative flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        isActive
          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
      )}
    >
      {IconComponent && <IconComponent className="h-3.5 w-3.5 shrink-0" />}
      <span>{label}</span>
    </button>
  )
}
