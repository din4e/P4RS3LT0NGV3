import { create } from 'zustand'

/**
 * Payload handed off from one tool to another via "send to tool" actions
 * (e.g. a taxonomy entry brought into the multi-turn sample builder).
 */
export interface HandoffPayload {
  /** Tool id the payload originated from. */
  fromTool: string
  /** Human-readable title for the handed-off item. */
  title: string
  /** Full text content to inject into the receiving tool. */
  content: string
}

interface HandoffState {
  /** Pending handoff, consumed (and cleared) by the receiving tool. */
  handoff: HandoffPayload | null
  /** Stage a payload and (typically) switch to the receiving tab. */
  setHandoff: (payload: HandoffPayload) => void
  /** Clear the pending handoff after consumption. */
  clearHandoff: () => void
}

export const useHandoffStore = create<HandoffState>((set) => ({
  handoff: null,
  setHandoff: (payload) => set({ handoff: payload }),
  clearHandoff: () => set({ handoff: null }),
}))
