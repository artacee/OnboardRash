/**
 * Dashboard Page — Fleet Command Center
 * 
 * Wrapped in .page-window for Vision OS floating glass effect.
 * Sections: Header, Stats Grid, Live Map, Alert Feed.
 * Uses WebSocket for real-time data + skeleton loading state.
 */

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import {
    Bus,
    CalendarDays,
    AlertTriangle,
    Activity,
    MapPin,
    Bell
} from 'lucide-react'
import { StatCard, LiveMap, AlertFeed, QuickActions, SystemHealth } from '@/components/dashboard'
import { useSocketIO } from '@/hooks'
import { useAudioAlert } from '@/hooks/useAudioAlert'
import api, { mapEvent } from '@/services/api'
import type { DashboardStats, BusLocation, Event as EventType } from '@/types'
import './Dashboard.css'

// Skeleton loader while data is fetching
function DashboardSkeleton() {
    return (
        <motion.div
            className="page-window"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="window-grain" />
            <div className="page-content">
                <div className="skeleton-header" style={{ height: '120px', marginBottom: 'var(--space-8)' }} />
                <div className="skeleton-stats-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton-card" />
                    ))}
                </div>
                <div className="skeleton-map" style={{ marginTop: 'var(--space-8)' }} />
                <div className="skeleton-feed" style={{ marginTop: 'var(--space-8)' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-text" style={{ height: '60px', marginBottom: 'var(--space-2)' }} />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [buses, setBuses] = useState<BusLocation[]>([])
    const [events, setEvents] = useState<EventType[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const { isConnected, connectionQuality, subscribe } = useSocketIO(
        import.meta.env.VITE_API_URL || window.location.origin
    )
    const { playAlert } = useAudioAlert()

    // Fetch initial data

    const fetchData = useCallback(async () => {
        try {
            const [statsData, busData, eventsData] = await Promise.all([
                api.stats.getStats(),
                api.buses.getBusLocations(),
                api.events.getEvents({ limit: 20, sort: 'desc' })
            ])
            setStats(statsData)
            setBuses(busData)
            setEvents(eventsData)
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err)
            // Provide empty defaults so UI still renders
            if (!stats) {
                setStats({
                    total_events_today: 0,
                    active_buses: 0,
                    total_buses: 0,
                    high_severity_count: 0,
                    event_breakdown: {}
                })
            }
        } finally {
            setIsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Listen for real-time updates
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsubAlert = subscribe('new_alert', (rawEvent: any) => {
            const event = mapEvent(rawEvent)
            setEvents(prev => [event, ...prev].slice(0, 50))

            if (event.severity === 'HIGH') {
                playAlert('high')
            }

            // Update stats
            setStats(prev => prev ? {
                ...prev,
                total_events_today: prev.total_events_today + 1,
                high_severity_count: event.severity === 'HIGH'
                    ? prev.high_severity_count + 1
                    : prev.high_severity_count
            } : prev)
        })

        return () => { unsubAlert() }
    }, [subscribe, playAlert])

    const handleRefresh = async () => {
        await fetchData()
    }

    const handleExport = () => {
        api.export.downloadEvents()
    }

    if (isLoading) {
        return <DashboardSkeleton />
    }

    // Vision OS Staggered Entry
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
        show: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 0.5,
                ease: [0.2, 0.8, 0.2, 1] as const
            }
        }
    }

    return (
        <>
            <motion.div
                className="page-window"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
            >
                <div className="window-grain" />
                <div className="window-glow" />

                <motion.div
                    className="page-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-8)'
                    }}
                >
                    {/* ─── HEADER ─── */}
                    <motion.header
                        variants={itemVariants}
                        className="dashboard-header"
                    >
                        <div className="header-main">
                            <div>
                                <h1 style={{
                                    fontSize: 'var(--text-large-title)',
                                    fontWeight: 'var(--weight-title)',
                                    color: 'var(--text-primary)',
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.1,
                                    marginBottom: 'var(--space-2)'
                                }}>
                                    Fleet Dashboard
                                </h1>
                                <p style={{
                                    fontSize: 'var(--text-body)',
                                    color: 'var(--text-tertiary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)'
                                }}>
                                    <span className="live-indicator" />
                                    Real-time fleet monitoring
                                </p>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-4)',
                                flexWrap: 'wrap'
                            }}>
                                <SystemHealth
                                    isConnected={isConnected}
                                    quality={connectionQuality}
                                    activeBuses={stats?.active_buses ?? 0}
                                />
                                <QuickActions
                                    onRefresh={handleRefresh}
                                    onExport={handleExport}
                                />
                            </div>
                        </div>
                    </motion.header>

                    {/* ─── STATS GRID ─── */}
                    <motion.section
                        variants={itemVariants}
                    >
                        <div className="section-header">
                            <h2 style={{
                                fontSize: 'var(--text-title-2)',
                                fontWeight: 'var(--weight-headline)',
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.02em'
                            }}>
                                Overview
                            </h2>
                        </div>

                        <div className="stats-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: 'var(--space-5)'
                        }}>
                            <StatCard
                                icon={<Bus size={28} />}
                                label="Active Buses"
                                value={stats?.active_buses ?? 0}
                                subtitle="Currently on route"
                                color="info"
                                delay={0}
                            />
                            <StatCard
                                icon={<CalendarDays size={28} />}
                                label="Events Today"
                                value={stats?.total_events_today ?? 0}
                                subtitle="Total recorded events"
                                color="warning"
                                delay={0.1}
                            />
                            <StatCard
                                icon={<AlertTriangle size={28} />}
                                label="High Severity"
                                value={stats?.high_severity_count ?? 0}
                                subtitle="Requires attention"
                                color="danger"
                                delay={0.2}
                                pulse={(stats?.high_severity_count ?? 0) > 0}
                            />
                            <StatCard
                                icon={<Activity size={28} />}
                                label="System Status"
                                value={isConnected ? 'Online' : 'Offline'}
                                subtitle={isConnected ? 'All systems operational' : 'Connection lost'}
                                color={isConnected ? 'safe' : 'danger'}
                                delay={0.3}
                            />
                        </div>
                    </motion.section>

                    {/* ─── LIVE MAP ─── */}
                    <motion.section
                        variants={itemVariants}
                    >
                        <div className="section-header">
                            <h2 style={{
                                fontSize: 'var(--text-title-2)',
                                fontWeight: 'var(--weight-headline)',
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.02em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)'
                            }}>
                                <MapPin size={22} style={{ color: 'var(--color-info)' }} />
                                Live Fleet Map
                            </h2>
                        </div>

                        <div className="glass-card" style={{ padding: 'var(--space-4)', overflow: 'hidden' }}>
                            <LiveMap buses={buses} height={480} />
                        </div>
                    </motion.section>

                    {/* ─── ALERT FEED ─── */}
                    <motion.section
                        variants={itemVariants}
                    >
                        <div className="section-header">
                            <h2 style={{
                                fontSize: 'var(--text-title-2)',
                                fontWeight: 'var(--weight-headline)',
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.02em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)'
                            }}>
                                <Bell size={22} style={{ color: 'var(--color-warning)' }} />
                                Recent Alerts
                            </h2>
                            <span style={{
                                fontSize: 'var(--text-footnote)',
                                color: 'var(--text-tertiary)',
                                fontWeight: 'var(--weight-headline)',
                                padding: 'var(--space-2) var(--space-3)',
                                background: 'var(--glass-t2-bg)',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid rgba(255,255,255,0.15)'
                            }}>
                                {events.length} events
                            </span>
                        </div>

                        <div className="glass-card" style={{ padding: 'var(--space-4)' }}>
                            <AlertFeed events={events} maxItems={15} />
                        </div>
                    </motion.section>
                </motion.div>
            </motion.div>
        </>
    )
}
