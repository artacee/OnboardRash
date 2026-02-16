/**
 * SystemHealth — Connection quality + active bus count badge
 */

import { motion } from 'framer-motion'
import { Wifi, WifiOff, Activity } from 'lucide-react'
import type { ConnectionQuality } from '@/types'

interface SystemHealthProps {
    isConnected: boolean
    quality: ConnectionQuality
    activeBuses: number
}

const qualityColors: Record<ConnectionQuality, string> = {
    excellent: 'var(--color-safe)',
    good: 'var(--color-info)',
    poor: 'var(--color-warning)',
    disconnected: 'var(--color-danger)'
}

const qualityLabels: Record<ConnectionQuality, string> = {
    excellent: 'Excellent',
    good: 'Good',
    poor: 'Poor',
    disconnected: 'Offline'
}

export default function SystemHealth({ isConnected, quality, activeBuses }: SystemHealthProps) {
    return (
        <motion.div
            className="glass-nested"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            style={{
                padding: 'var(--space-4) var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}
        >
            {/* Background gradient */}
            <motion.div
                animate={{
                    opacity: [0.05, 0.1, 0.05],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at 50% 50%, ${qualityColors[quality]}, transparent 70%)`,
                    pointerEvents: 'none'
                }}
            />

            {/* Connection Status */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                position: 'relative',
                zIndex: 1
            }}>
                {isConnected ? (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                color: qualityColors[quality],
                                filter: `drop-shadow(0 0 4px ${qualityColors[quality]})`,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Wifi size={18} />
                        </motion.div>
                        <div>
                            <div style={{
                                fontSize: 'var(--text-footnote)',
                                color: 'var(--text-secondary)',
                                fontWeight: 'var(--weight-headline)',
                                lineHeight: 1.2
                            }}>
                                {qualityLabels[quality]}
                            </div>
                            <div style={{
                                fontSize: 'var(--text-caption)',
                                color: 'var(--text-tertiary)'
                            }}>
                                Connection
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ color: 'var(--color-danger)' }}
                        >
                            <WifiOff size={18} />
                        </motion.div>
                        <div>
                            <div style={{
                                fontSize: 'var(--text-footnote)',
                                color: 'var(--color-danger)',
                                fontWeight: 'var(--weight-headline)'
                            }}>
                                Offline
                            </div>
                            <div style={{
                                fontSize: 'var(--text-caption)',
                                color: 'var(--text-tertiary)'
                            }}>
                                Reconnecting...
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Divider */}
            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                style={{
                    width: '1px',
                    height: '32px',
                    background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.15), transparent)',
                    position: 'relative',
                    zIndex: 1
                }}
            />

            {/* Active Buses */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                position: 'relative',
                zIndex: 1
            }}>
                <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        color: 'var(--color-info)',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <Activity size={18} />
                </motion.div>
                <div>
                    <div style={{
                        fontSize: 'var(--text-footnote)',
                        color: 'var(--text-primary)',
                        fontWeight: 'var(--weight-headline)',
                        lineHeight: 1.2
                    }}>
                        {activeBuses}
                    </div>
                    <div style={{
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-tertiary)'
                    }}>
                        Active
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
