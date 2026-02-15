// ============================================================
// OnboardRash — UI Store (Zustand)
// Manages sidebar, modals, theme, command palette
// ============================================================

import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  soundEnabled: boolean
  connected: boolean

  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  setCommandPaletteOpen: (v: boolean) => void
  setSoundEnabled: (v: boolean) => void
  setConnected: (v: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  soundEnabled: true,
  connected: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
  setSoundEnabled: (v) => set({ soundEnabled: v }),
  setConnected: (v) => set({ connected: v }),
}))
