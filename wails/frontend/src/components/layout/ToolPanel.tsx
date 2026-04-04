'use client'

import { Suspense, lazy, Component, type ErrorInfo, type ReactNode } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

/**
 * Lazy-loaded tool component map.
 *
 * Each tool panel is loaded on demand so the initial bundle stays small.
 * Components live under `@/components/tools/<ToolId>Tool.tsx`.
 */
const TOOL_COMPONENT_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  transforms: lazy(() => import('@/components/tools/TransformsTool')),
  decoder: lazy(() => import('@/components/tools/DecoderTool')),
  steganography: lazy(() => import('@/components/tools/SteganographyTool')),
  tokenade: lazy(() => import('@/components/tools/TokenadeTool')),
  fuzzer: lazy(() => import('@/components/tools/FuzzerTool')),
  tokenizer: lazy(() => import('@/components/tools/TokenizerTool')),
  bijection: lazy(() => import('@/components/tools/BijectionTool')),
  splitter: lazy(() => import('@/components/tools/SplitterTool')),
  gibberish: lazy(() => import('@/components/tools/GibberishTool')),
  promptcraft: lazy(() => import('@/components/tools/PromptCraftTool')),
  translate: lazy(() => import('@/components/tools/TranslateTool')),
  anticlassifier: lazy(() => import('@/components/tools/AntiClassifierTool')),
  ccbos: lazy(() => import('@/components/tools/CCBosTool')),
}

/**
 * Renders the active tool's content panel with lazy loading, a loading
 * spinner fallback, and a per-tool error boundary.
 */
export function ToolPanel() {
  const activeTab = useAppStore((s) => s.activeTab)

  const ToolComponent = TOOL_COMPONENT_MAP[activeTab]

  return (
    <section className="flex-1 overflow-auto p-4">
      <ErrorBoundary key={activeTab}>
        <Suspense fallback={<LoadingSkeleton />}>
          {ToolComponent ? (
            <ToolComponent />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
              No tool configured for &quot;{activeTab}&quot;
            </div>
          )}
        </Suspense>
      </ErrorBoundary>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Loading skeleton (matches tool layout: input area + output area)   */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse" aria-hidden="true">
      {/* Toolbar / controls row */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-48 rounded-md bg-[var(--muted)]" />
        <div className="h-8 w-24 rounded-md bg-[var(--muted)]" />
        <div className="ml-auto h-8 w-20 rounded-md bg-[var(--muted)]" />
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-[var(--muted)]" />
        <div
          className={cn(
            'w-full rounded-md bg-[var(--muted)]',
            'min-h-[120px]',
          )}
        >
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/2 rounded bg-[var(--border)]" />
            <div className="h-3 w-5/6 rounded bg-[var(--border)]" />
          </div>
        </div>
      </div>

      {/* Output area */}
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-[var(--muted)]" />
        <div
          className={cn(
            'w-full rounded-md bg-[var(--muted)]',
            'min-h-[120px]',
          )}
        >
          <div className="p-3 space-y-2">
            <div className="h-3 w-2/3 rounded bg-[var(--border)]" />
            <div className="h-3 w-4/5 rounded bg-[var(--border)]" />
            <div className="h-3 w-1/3 rounded bg-[var(--border)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Per-tool error boundary                                            */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ToolPanel] Error in tool component:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center h-full gap-2',
            'text-[var(--destructive)]',
          )}
        >
          <p className="text-sm font-medium">Something went wrong loading this tool.</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {this.state.error?.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className={cn(
              'mt-2 px-3 py-1 text-xs rounded-md',
              'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
              'hover:bg-[var(--accent)] transition-colors',
            )}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
