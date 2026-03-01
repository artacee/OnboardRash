/**
 * Settings Page — System Configuration & Management
 * 
 * Features:
 * - Reset events database with confirmation
 * - Bus information management
 * - System statistics
 * - Wrapped in .page-window for Vision OS floating glass effect
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
    Trash2,
    Bus,
    AlertCircle,
    Database,
    RefreshCw,
    Activity,
    MapPin,
    User,
    Route as RouteIcon,
    X,
    AlertTriangle,
    Play,
    Square,
    Plus,
    CheckCircle,
    Phone,
    ShieldCheck,
    Hash
} from 'lucide-react'
import api from '@/services/api'
import type { Bus as BusType } from '@/types'
import type { DriverRecord } from '@/services/api'
import './Settings.css'

interface SystemStats {
    total_events: number
    total_buses: number
    storage_used: string
    uptime: string
}

export default function Settings() {
    const [buses, setBuses] = useState<BusType[]>([])
    const [drivers, setDrivers] = useState<DriverRecord[]>([])
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [resetSuccess, setResetSuccess] = useState(false)

    // Simulation state
    const [isSimRunning, setIsSimRunning] = useState(false)
    const [isSimLoading, setIsSimLoading] = useState(false)

    // Register bus modal state
    const [showAddBus, setShowAddBus] = useState(false)
    const [busForm, setBusForm] = useState({ registration_number: '', driver_name: '', route: '' })
    const [busFormError, setBusFormError] = useState<string | null>(null)
    const [isAddingBus, setIsAddingBus] = useState(false)
    const [addBusSuccess, setAddBusSuccess] = useState(false)

    const handleAddBus = async () => {
        const reg = busForm.registration_number.trim()
        if (!reg) { setBusFormError('Registration number is required'); return }
        setIsAddingBus(true)
        setBusFormError(null)
        try {
            await api.buses.registerBus({
                registration_number: reg,
                driver_name: busForm.driver_name.trim() || undefined,
                route: busForm.route.trim() || undefined,
            })
            setAddBusSuccess(true)
            setTimeout(() => {
                setAddBusSuccess(false)
                setShowAddBus(false)
                setBusForm({ registration_number: '', driver_name: '', route: '' })
                fetchData()
            }, 1500)
        } catch (err: any) {
            setBusFormError(err.message || 'Failed to register bus')
        } finally {
            setIsAddingBus(false)
        }
    }

    // Fetch data
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [busesData, statsData, driversData] = await Promise.all([
                api.buses.getBuses(),
                api.stats.getStats(),
                api.drivers.getDrivers(),
            ])
            setBuses(busesData)
            setDrivers(driversData)
            setStats({
                total_events: statsData.total_events_today,
                total_buses: busesData.length,
                storage_used: '2.3 MB',
                uptime: '99.8%'
            })
        } catch (err) {
            console.error('Failed to fetch settings data:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSimStatus = async () => {
        try {
            const status = await api.simulation.getStatus()
            setIsSimRunning(status.running)
        } catch (err) {
            console.error('Failed to fetch simulation status:', err)
        }
    }

    // Fetch simulation status on mount
    useEffect(() => {
        fetchSimStatus()
        // Poll every 5 seconds to keep sync
        const interval = setInterval(fetchSimStatus, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleToggleSimulation = async () => {
        setIsSimLoading(true)
        try {
            if (isSimRunning) {
                await api.simulation.stop()
                setIsSimRunning(false)
            } else {
                await api.simulation.start()
                setIsSimRunning(true)
            }
        } catch (err) {
            console.error('Failed to toggle simulation:', err)
            alert('Failed to update simulation state')
        } finally {
            setIsSimLoading(false)
        }
    }

    const handleResetEvents = async () => {
        setIsResetting(true)
        try {
            // Call the API to reset events
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/events/reset`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })

            if (response.ok) {
                setResetSuccess(true)
                setTimeout(() => {
                    setResetSuccess(false)
                    setShowResetConfirm(false)
                    fetchData()
                }, 2000)
            }
        } catch (err) {
            console.error('Failed to reset events:', err)
            alert('Failed to reset events. Please try again.')
        } finally {
            setIsResetting(false)
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

                <div className="page-content" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-8)'
                }}>
                    {/* ─── PAGE HEADER ─── */}
                    <motion.div
                        className="settings-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <div>
                            <h1 style={{
                                fontSize: 'var(--text-large-title)',
                                fontWeight: 'var(--weight-title)',
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.03em',
                                lineHeight: 1.1,
                                marginBottom: 'var(--space-2)'
                            }}>
                                Settings
                            </h1>
                            <p style={{
                                fontSize: 'var(--text-body)',
                                color: 'var(--text-tertiary)'
                            }}>
                                System configuration and management
                            </p>
                        </div>
                    </motion.div>

                    {/* ─── SYSTEM STATS ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <h2 className="section-title">System Overview</h2>
                        <div className="stats-grid-settings">
                            <div className="glass-card stat-card-settings">
                                <Database size={24} style={{ color: 'var(--color-info)' }} />
                                <div>
                                    <span className="stat-label">Total Events</span>
                                    <span className="stat-value">{stats?.total_events ?? 0}</span>
                                </div>
                            </div>
                            <div className="glass-card stat-card-settings">
                                <Bus size={24} style={{ color: 'var(--color-safe)' }} />
                                <div>
                                    <span className="stat-label">Registered Buses</span>
                                    <span className="stat-value">{stats?.total_buses ?? 0}</span>
                                </div>
                            </div>
                            <div className="glass-card stat-card-settings">
                                <Activity size={24} style={{ color: 'var(--color-warning)' }} />
                                <div>
                                    <span className="stat-label">Storage Used</span>
                                    <span className="stat-value">{stats?.storage_used ?? 'N/A'}</span>
                                </div>
                            </div>
                            <div className="glass-card stat-card-settings">
                                <RefreshCw size={24} style={{ color: 'var(--color-info)' }} />
                                <div>
                                    <span className="stat-label">System Uptime</span>
                                    <span className="stat-value">{stats?.uptime ?? 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* ─── SIMULATION CONTROL ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                    >
                        <h2 className="section-title">Simulation Control</h2>
                        <div className="glass-card management-card">
                            <div className="management-info">
                                <Activity size={32} style={{ color: isSimRunning ? 'var(--color-safe)' : 'var(--text-tertiary)' }} />
                                <div>
                                    <h3 style={{
                                        fontSize: 'var(--text-title-3)',
                                        fontWeight: 'var(--weight-headline)',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--space-1)'
                                    }}>
                                        Bus Simulator
                                    </h3>
                                    <p style={{
                                        fontSize: 'var(--text-callout)',
                                        color: 'var(--text-tertiary)',
                                        lineHeight: 1.6
                                    }}>
                                        {isSimRunning
                                            ? 'The simulator is currently running and generating events.'
                                            : 'The simulator is stopped. No new events will be generated.'}
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                className={`reset-button ${isSimRunning ? 'stop-button' : 'start-button'}`}
                                onClick={handleToggleSimulation}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isSimLoading}
                                style={{
                                    background: isSimRunning
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : 'rgba(52, 211, 153, 0.1)',
                                    color: isSimRunning
                                        ? 'var(--color-danger)'
                                        : 'var(--color-safe)',
                                    border: `1px solid ${isSimRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)'}`
                                }}
                            >
                                {isSimLoading ? (
                                    <RefreshCw size={18} className="spinning" />
                                ) : isSimRunning ? (
                                    <Square size={18} fill="currentColor" />
                                ) : (
                                    <Play size={18} fill="currentColor" />
                                )}
                                {isSimRunning ? 'Stop Simulation' : 'Start Simulation'}
                            </motion.button>
                        </div>
                    </motion.section>

                    {/* ─── DATABASE MANAGEMENT ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h2 className="section-title">Database Management</h2>
                        <div className="glass-card management-card">
                            <div className="management-info">
                                <AlertTriangle size={32} style={{ color: 'var(--color-danger)' }} />
                                <div>
                                    <h3 style={{
                                        fontSize: 'var(--text-title-3)',
                                        fontWeight: 'var(--weight-headline)',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--space-1)'
                                    }}>
                                        Reset All Events
                                    </h3>
                                    <p style={{
                                        fontSize: 'var(--text-callout)',
                                        color: 'var(--text-tertiary)',
                                        lineHeight: 1.6
                                    }}>
                                        Permanently delete all event records from the database.
                                        This action cannot be undone and will clear all historical data.
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                className="reset-button"
                                onClick={() => setShowResetConfirm(true)}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Trash2 size={18} />
                                Reset Events Database
                            </motion.button>
                        </div>
                    </motion.section>

                    {/* ─── BUS INFORMATION ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                            <h2 className="section-title" style={{ marginBottom: 0 }}>
                                Registered Buses ({buses.length})
                            </h2>
                            <motion.button
                                className="add-bus-btn"
                                onClick={() => { setBusFormError(null); setAddBusSuccess(false); setShowAddBus(true) }}
                                whileHover={{ scale: 1.04, y: -1 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Plus size={16} />
                                Register Bus
                            </motion.button>
                        </div>

                        {isLoading ? (
                            <div className="buses-loading">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="skeleton-card" />
                                ))}
                            </div>
                        ) : buses.length === 0 ? (
                            <div className="glass-card empty-state">
                                <Bus size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
                                <p style={{
                                    fontSize: 'var(--text-title-3)',
                                    fontWeight: 'var(--weight-headline)',
                                    color: 'var(--text-secondary)',
                                    marginBottom: 'var(--space-2)'
                                }}>
                                    No buses registered
                                </p>
                                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>
                                    Click &ldquo;Register Bus&rdquo; above to add your first bus
                                </p>
                            </div>
                        ) : (
                            <div className="buses-grid">
                                <AnimatePresence mode="popLayout">
                                    {buses.map((bus, index) => (
                                        <motion.div
                                            key={bus.id}
                                            className="glass-card bus-card"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                        >
                                            <div className="bus-card-header">
                                                <div className="bus-icon">
                                                    <Bus size={24} />
                                                </div>
                                                <span className={`bus-status ${bus.is_active ? 'active' : 'inactive'}`}>
                                                    {bus.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            <div className="bus-card-body">
                                                <h3 className="bus-registration">
                                                    {bus.registration_number}
                                                </h3>

                                                {bus.driver_name && (
                                                    <div className="bus-detail">
                                                        <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                                                        <span>{bus.driver_name}</span>
                                                    </div>
                                                )}

                                                {bus.route && (
                                                    <div className="bus-detail">
                                                        <RouteIcon size={16} style={{ color: 'var(--text-tertiary)' }} />
                                                        <span>{bus.route}</span>
                                                    </div>
                                                )}

                                                <div className="bus-detail">
                                                    <MapPin size={16} style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="bus-meta">
                                                        Registered {new Date(bus.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.section>

                    {/* ─── REGISTERED DRIVERS ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <h2 className="section-title">
                            Registered Drivers ({drivers.length})
                        </h2>

                        {isLoading ? (
                            <div className="buses-loading">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="skeleton-card" />
                                ))}
                            </div>
                        ) : drivers.length === 0 ? (
                            <div className="glass-card empty-state">
                                <User size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
                                <p style={{ fontSize: 'var(--text-title-3)', fontWeight: 'var(--weight-headline)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    No drivers registered
                                </p>
                                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>
                                    Drivers register through the driver companion app
                                </p>
                            </div>
                        ) : (
                            <div className="buses-grid">
                                <AnimatePresence mode="popLayout">
                                    {drivers.map((driver, index) => (
                                        <motion.div
                                            key={driver.id}
                                            className="glass-card bus-card"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                        >
                                            <div className="bus-card-header">
                                                <div className="bus-icon" style={{ background: 'rgba(96,165,250,0.12)' }}>
                                                    <User size={24} style={{ color: 'var(--color-info)' }} />
                                                </div>
                                                <span className={`bus-status ${driver.is_active ? 'active' : 'inactive'}`}>
                                                    {driver.is_active ? 'On Trip' : 'Offline'}
                                                </span>
                                            </div>

                                            <div className="bus-card-body">
                                                <h3 className="bus-registration" style={{ fontSize: 'var(--text-title-3)' }}>
                                                    {driver.full_name}
                                                </h3>

                                                <div className="bus-detail">
                                                    <Hash size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}>@{driver.username}</span>
                                                </div>

                                                {driver.phone_number && (
                                                    <div className="bus-detail">
                                                        <Phone size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                        <span>{driver.phone_number}</span>
                                                    </div>
                                                )}

                                                {driver.license_number && (
                                                    <div className="bus-detail">
                                                        <ShieldCheck size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                        <span>{driver.license_number}</span>
                                                    </div>
                                                )}

                                                <div className="bus-detail">
                                                    <Activity size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                    <span className="bus-meta">
                                                        {driver.trip_count} trip{driver.trip_count !== 1 ? 's' : ''} · Joined {new Date(driver.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.section>
                </div>
            </motion.div>

            {/* ─── ADD BUS MODAL ─── */}
            <AnimatePresence>
                {showAddBus && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isAddingBus && setShowAddBus(false)}
                    >
                        <motion.div
                            className="glass-card confirm-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                            onClick={e => e.stopPropagation()}
                        >
                            {addBusSuccess ? (
                                <div className="success-content">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                        style={{
                                            width: '64px', height: '64px', borderRadius: '50%',
                                            background: 'var(--color-safe-bg)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            marginBottom: 'var(--space-4)'
                                        }}
                                    >
                                        <CheckCircle size={32} style={{ color: 'var(--color-safe)' }} />
                                    </motion.div>
                                    <h3 style={{ fontSize: 'var(--text-title-2)', fontWeight: 'var(--weight-title)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Bus Registered!</h3>
                                    <p style={{ fontSize: 'var(--text-callout)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        The bus is now available in the driver app.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <motion.button
                                        className="modal-close"
                                        onClick={() => setShowAddBus(false)}
                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        disabled={isAddingBus}
                                    >
                                        <X size={20} />
                                    </motion.button>

                                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '16px',
                                            background: 'var(--color-info-bg)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto var(--space-4)'
                                        }}>
                                            <Bus size={28} style={{ color: 'var(--color-info)' }} />
                                        </div>
                                        <h3 style={{ fontSize: 'var(--text-title-2)', fontWeight: 'var(--weight-title)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Register New Bus</h3>
                                        <p style={{ fontSize: 'var(--text-callout)', color: 'var(--text-tertiary)' }}>Will appear in driver app immediately</p>
                                    </div>

                                    <div className="bus-form">
                                        <div className="bus-form-field">
                                            <label className="bus-form-label">Registration Number *</label>
                                            <input
                                                className="bus-form-input"
                                                placeholder="e.g. KL-01-AB-1234"
                                                value={busForm.registration_number}
                                                onChange={e => setBusForm(f => ({ ...f, registration_number: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && handleAddBus()}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="bus-form-field">
                                            <label className="bus-form-label">Driver Name <span style={{ color: 'var(--text-quaternary)' }}>(optional)</span></label>
                                            <input
                                                className="bus-form-input"
                                                placeholder="e.g. Rahul Kumar"
                                                value={busForm.driver_name}
                                                onChange={e => setBusForm(f => ({ ...f, driver_name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="bus-form-field">
                                            <label className="bus-form-label">Route <span style={{ color: 'var(--text-quaternary)' }}>(optional)</span></label>
                                            <input
                                                className="bus-form-input"
                                                placeholder="e.g. Kollam – Trivandrum"
                                                value={busForm.route}
                                                onChange={e => setBusForm(f => ({ ...f, route: e.target.value }))}
                                            />
                                        </div>
                                        {busFormError && (
                                            <p style={{ fontSize: 'var(--text-footnote)', color: 'var(--color-danger)', marginTop: 'var(--space-1)' }}>
                                                {busFormError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="modal-actions">
                                        <motion.button
                                            className="modal-button modal-button-secondary"
                                            onClick={() => setShowAddBus(false)}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            disabled={isAddingBus}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            className="modal-button modal-button-primary"
                                            onClick={handleAddBus}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            disabled={isAddingBus}
                                        >
                                            {isAddingBus ? (
                                                <><RefreshCw size={16} className="spinning" /> Registering...</>
                                            ) : (
                                                <><Bus size={16} /> Register Bus</>
                                            )}
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── RESET CONFIRMATION MODAL ─── */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isResetting && setShowResetConfirm(false)}
                    >
                        <motion.div
                            className="glass-card confirm-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                            onClick={e => e.stopPropagation()}
                        >
                            {resetSuccess ? (
                                <div className="success-content">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '50%',
                                            background: 'var(--color-safe-bg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 'var(--space-4)'
                                        }}
                                    >
                                        <Activity size={32} style={{ color: 'var(--color-safe)' }} />
                                    </motion.div>
                                    <h3 style={{
                                        fontSize: 'var(--text-title-2)',
                                        fontWeight: 'var(--weight-title)',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--space-2)'
                                    }}>
                                        Events Reset Successfully
                                    </h3>
                                    <p style={{
                                        fontSize: 'var(--text-callout)',
                                        color: 'var(--text-secondary)',
                                        textAlign: 'center'
                                    }}>
                                        All event records have been cleared from the database.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <motion.button
                                        className="modal-close"
                                        onClick={() => setShowResetConfirm(false)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        disabled={isResetting}
                                    >
                                        <X size={20} />
                                    </motion.button>

                                    <div className="modal-icon-danger">
                                        <AlertCircle size={48} />
                                    </div>

                                    <h3 style={{
                                        fontSize: 'var(--text-title-2)',
                                        fontWeight: 'var(--weight-title)',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--space-2)',
                                        textAlign: 'center'
                                    }}>
                                        Confirm Reset
                                    </h3>

                                    <p style={{
                                        fontSize: 'var(--text-callout)',
                                        color: 'var(--text-secondary)',
                                        textAlign: 'center',
                                        marginBottom: 'var(--space-6)',
                                        lineHeight: 1.6
                                    }}>
                                        Are you sure you want to delete all event records? This action will permanently
                                        remove <strong>{stats?.total_events ?? 0} events</strong> from the database and cannot be undone.
                                    </p>

                                    <div className="modal-actions">
                                        <motion.button
                                            className="modal-button modal-button-secondary"
                                            onClick={() => setShowResetConfirm(false)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={isResetting}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            className="modal-button modal-button-danger"
                                            onClick={handleResetEvents}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={isResetting}
                                        >
                                            {isResetting ? (
                                                <>
                                                    <RefreshCw size={16} className="spinning" />
                                                    Resetting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 size={16} />
                                                    Reset Database
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
