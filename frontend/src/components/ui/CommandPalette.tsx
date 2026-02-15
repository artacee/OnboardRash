// ============================================================
// CommandPalette — ⌘K fuzzy search dialog
// ============================================================

import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Bus,
  BarChart3,
  AlertTriangle,
  Download,
  Search,
} from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen)
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const navigate = useNavigate()

  function runAction(path: string) {
    navigate(path)
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-void/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg glass-strong rounded-2xl overflow-hidden shadow-2xl"
          >
            <Command
              className="[&_[cmdk-group-heading]]:text-text-ghost [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
              label="Command Palette"
            >
              <div className="flex items-center gap-3 px-4 border-b border-border-subtle">
                <Search className="w-4 h-4 text-text-ghost flex-shrink-0" />
                <Command.Input
                  placeholder="Search buses, events, actions..."
                  className="w-full py-4 bg-transparent text-sm text-text-primary placeholder:text-text-ghost outline-none"
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="text-text-ghost text-sm text-center py-8">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation">
                  <CommandItem icon={LayoutDashboard} onSelect={() => runAction('/dashboard')}>
                    Command Center
                  </CommandItem>
                  <CommandItem icon={AlertTriangle} onSelect={() => runAction('/dashboard/events')}>
                    All Events
                  </CommandItem>
                  <CommandItem icon={Bus} onSelect={() => runAction('/dashboard/fleet')}>
                    Fleet Overview
                  </CommandItem>
                  <CommandItem icon={BarChart3} onSelect={() => runAction('/dashboard/analytics')}>
                    Analytics
                  </CommandItem>
                </Command.Group>

                <Command.Group heading="Actions">
                  <CommandItem icon={Download} onSelect={() => { window.location.href = '/api/export/events'; setOpen(false) }}>
                    Export Events CSV
                  </CommandItem>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CommandItem({
  children,
  icon: Icon,
  onSelect,
}: {
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  onSelect: () => void
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary cursor-pointer transition-colors data-[selected=true]:bg-surface-1 data-[selected=true]:text-text-primary"
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {children}
    </Command.Item>
  )
}
