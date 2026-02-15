// ============================================================
// OnboardRash — Bus Store (Zustand)
// Manages fleet state: bus list, live locations
// ============================================================

import { create } from 'zustand'
import type { Bus, BusLocation } from '@/lib/types'

interface BusState {
  buses: Bus[]
  locations: BusLocation[]
  selectedBusId: number | null

  setBuses: (buses: Bus[]) => void
  setLocations: (locations: BusLocation[]) => void
  selectBus: (id: number | null) => void
}

export const useBusStore = create<BusState>((set) => ({
  buses: [],
  locations: [],
  selectedBusId: null,

  setBuses: (buses) => set({ buses }),
  setLocations: (locations) => set({ locations }),
  selectBus: (id) => set({ selectedBusId: id }),
}))
