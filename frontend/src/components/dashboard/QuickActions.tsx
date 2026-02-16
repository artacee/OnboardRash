/**
 * QuickActions — Refresh + Export buttons with micro-animations
 */

import { motion } from 'framer-motion'
import { RefreshCw, Download } from 'lucide-react'
import { useState } from 'react'

interface QuickActionsProps {
    onRefresh: () => Promise<void>
    onExport: () => void
}

const buttonStyle: React.CSSProperties = {
    padding: 'var(--space-3) var(--space-5)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-callout)',
    fontWeight: 'var(--weight-headline)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--text-primary)',
    position: 'relative' as const,
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    background: 'var(--glass-t2-bg)',
    transition: 'all 0.2s ease'
}

export default function QuickActions({ onRefresh, onExport }: QuickActionsProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await onRefresh()
        setTimeout(() => setIsRefreshing(false), 500)
    }

    const handleExport = () => {
        setIsExporting(true)
        onExport()
        setTimeout(() => setIsExporting(false), 1000)
    }

    return (
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                whileHover={{ scale: isRefreshing ? 1 : 1.05, y: isRefreshing ? 0 : -2 }}
                whileTap={{ scale: isRefreshing ? 1 : 0.97 }}
                style={{
                    ...buttonStyle,
                    cursor: isRefreshing ? 'not-allowed' : 'pointer'
                }}
            >
                {isRefreshing && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '50%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            pointerEvents: 'none'
                        }}
                    />
                )}
                <motion.div
                    animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.6, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
                    style={{ position: 'relative', zIndex: 1, display: 'flex' }}
                >
                    <RefreshCw size={16} />
                </motion.div>
                <span style={{ position: 'relative', zIndex: 1 }}>Refresh</span>
            </motion.button>

            <motion.button
                onClick={handleExport}
                disabled={isExporting}
                whileHover={{ scale: isExporting ? 1 : 1.05, y: isExporting ? 0 : -2 }}
                whileTap={{ scale: isExporting ? 1 : 0.97 }}
                style={{
                    ...buttonStyle,
                    cursor: isExporting ? 'not-allowed' : 'pointer'
                }}
            >
                <motion.div
                    animate={isExporting ? { y: [0, 3, 0] } : { y: 0 }}
                    transition={{ duration: 0.5, repeat: isExporting ? Infinity : 0 }}
                    style={{ position: 'relative', zIndex: 1, display: 'flex' }}
                >
                    <Download size={16} />
                </motion.div>
                <span style={{ position: 'relative', zIndex: 1 }}>Export</span>
            </motion.button>
        </div>
    )
}
