/**
 * AlertFeed — Real-time scrolling event feed
 * 
 * Features:
 * - AnimatePresence for slide-in/out
 * - Severity icons and colors
 * - Pulsing glow for HIGH severity events
 * - "All Clear" empty state with floating icon
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
    AlertCircle,
    AlertTriangle,
    Info,
    ChevronRight,
    Clock
} from 'lucide-react'
import type { Event } from '@/types'

interface AlertFeedProps {
    events: Event[]
    maxItems?: number
    onEventClick?: (event: Event) => void
}

export default function AlertFeed({
    events,
    maxItems = 15,
    onEventClick
}: AlertFeedProps) {
    const [hoveredId, setHoveredId] = useState<number | null>(null)

    const displayEvents = events.slice(0, maxItems)

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'HIGH': return <AlertCircle size={18} />
            case 'MEDIUM': return <AlertTriangle size={18} />
            default: return <Info size={18} />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'var(--color-danger)'
            case 'MEDIUM': return 'var(--color-warning)'
            default: return 'var(--color-info)'
        }
    }

    const formatEventType = (type: string) => {
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div
            className="alert-feed"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                maxHeight: '500px',
                overflowY: 'auto',
                padding: 'var(--space-2)'
            }}
        >
            <AnimatePresence mode="popLayout">
                {displayEvents.map((event, index) => (
                    <motion.div
                        key={event.id}
                        className="glass-nested alert-item"
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{
                            scale: 1.02,
                            x: 6,
                            transition: { type: 'spring', stiffness: 400, damping: 25 }
                        }}
                        onClick={() => onEventClick?.(event)}
                        onMouseEnter={() => setHoveredId(event.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-4)',
                            borderLeft: `3px solid ${getSeverityColor(event.severity)}`,
                            cursor: 'pointer',
                            position: 'relative',
                            background: hoveredId === event.id
                                ? 'rgba(255,255,255,0.05)'
                                : 'transparent'
                        }}
                    >
                        {/* Pulsing glow for HIGH severity */}
                        {event.severity === 'HIGH' && (
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 'inherit',
                                    boxShadow: `0 0 20px ${getSeverityColor(event.severity)}40`,
                                    pointerEvents: 'none'
                                }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        )}

                        {/* Severity Icon */}
                        <div style={{
                            color: getSeverityColor(event.severity),
                            flexShrink: 0
                        }}>
                            {getSeverityIcon(event.severity)}
                        </div>

                        {/* Event Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                marginBottom: 'var(--space-1)'
                            }}>
                                <span style={{
                                    fontSize: 'var(--text-callout)',
                                    fontWeight: 'var(--weight-headline)',
                                    color: 'var(--text-primary)'
                                }}>
                                    {formatEventType(event.event_type)}
                                </span>

                                <span style={{
                                    fontSize: 'var(--text-caption)',
                                    fontWeight: 'var(--weight-headline)',
                                    color: getSeverityColor(event.severity),
                                    padding: '2px 8px',
                                    background: `${getSeverityColor(event.severity)}15`,
                                    borderRadius: 'var(--radius-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {event.severity}
                                </span>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                fontSize: 'var(--text-footnote)',
                                color: 'var(--text-tertiary)'
                            }}>
                                <span>🚌 {event.bus_id}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                                {event.speed > 0 && <span>{event.speed} km/h</span>}
                            </div>
                        </div>

                        {/* Chevron */}
                        <motion.div
                            animate={{
                                x: hoveredId === event.id ? 4 : 0,
                                opacity: hoveredId === event.id ? 1 : 0.3
                            }}
                            transition={{ duration: 0.2 }}
                            style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
                        >
                            <ChevronRight size={18} />
                        </motion.div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {events.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        padding: 'var(--space-12)',
                        textAlign: 'center',
                        color: 'var(--text-tertiary)',
                        fontSize: 'var(--text-body)'
                    }}
                >
                    <motion.div
                        animate={{ y: [0, -10, 0], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ marginBottom: 'var(--space-4)' }}
                    >
                        <Info size={48} style={{ opacity: 0.3 }} />
                    </motion.div>
                    <p style={{
                        fontSize: 'var(--text-title-3)',
                        fontWeight: 'var(--weight-headline)',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        All Clear
                    </p>
                    <p style={{
                        fontSize: 'var(--text-body)',
                        color: 'var(--text-tertiary)'
                    }}>
                        No recent alerts. Fleet is operating smoothly.
                    </p>
                </motion.div>
            )}
        </div>
    )
}
