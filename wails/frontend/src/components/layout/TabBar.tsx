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
  MessageCircle,
  WandSparkles,
  Languages,
  Bot,
  Scroll,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore, TOOL_CONFIGS, type ToolConfig } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

/**
 * Maps icon names from ToolConfig to lucide-react components.
 */
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
  MessageCircle,
  WandSparkles,
  Languages,
  Bot,
  Scroll,
}

/**
 * Horizontal tool tab navigation bar.
 *
 * Renders a button for every tool defined in `TOOL_CONFIGS`, highlighting
 * the currently active tab. On narrow viewports the bar scrolls
 * horizontally.
 */
export function TabBar() {
  const t = useTranslations('tools')
  const activeTab = useAppStore((s) => s.activeTab)
  const switchTab = useAppStore((s) => s.switchTab)

  return (
    <nav
      role="tablist"
      aria-label="Tool navigation"
      className={cn(
        'flex shrink-0 overflow-x-auto',
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

/* ------------------------------------------------------------------ */
/* Internal tab button                                                */
/* ------------------------------------------------------------------ */

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
        'flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap',
        'border-b-2 transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        isActive
          ? 'border-[var(--primary)] text-[var(--primary)]'
          : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]',
      )}
    >
      {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
      <span>{label}</span>
      <kbd
        className={cn(
          'hidden sm:inline-flex items-center justify-center',
          'ml-1 px-1 py-0.5 text-[10px] font-mono leading-none rounded',
          'bg-[var(--muted)] text-[var(--muted-foreground)]',
        )}
      >
        {tool.shortcut}
      </kbd>
    </button>
  )
}
