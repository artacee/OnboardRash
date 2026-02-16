/**
 * Events Page — Event History & Evidence
 * 
 * Wrapped in .page-window for Vision OS floating glass effect.
 * Features: filter toolbar, sortable table, pagination, evidence modal.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import {
    Search,
    Download,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    AlertTriangle,
    Info,
    X,
    MapPin,
    Clock,
    Gauge,
    Zap
} from 'lucide-react'
import { Navbar } from '@/components/layout'
import api from '@/services/api'
import type { Event, EventType, EventSeverity } from '@/types'
import './Events.css'

const ITEMS_PER_PAGE = 15

const EVENT_TYPE_OPTIONS: { value: EventType | ''; label: string }[] = [
    { value: '', label: 'All Types' },
    { value: 'HARSH_BRAKE', label: 'Harsh Brake' },
    { value: 'HARSH_ACCEL', label: 'Harsh Acceleration' },
    { value: 'AGGRESSIVE_TURN', label: 'Aggressive Turn' },
    { value: 'TAILGATING', label: 'Tailgating' },
    { value: 'CLOSE_OVERTAKING', label: 'Close Overtaking' }
]

const SEVERITY_OPTIONS: { value: EventSeverity | ''; label: string }[] = [
    { value: '', label: 'All Severities' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
]

export default function Events() {
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<EventType | ''>('')
    const [severityFilter, setSeverityFilter] = useState<EventSeverity | ''>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await api.events.getEvents({
                    event_type: typeFilter || undefined,
                    severity: severityFilter || undefined,
                    sort: 'desc'
                })
                setEvents(data)
            } catch (err) {
                console.error('Failed to fetch events:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchEvents()
    }, [typeFilter, severityFilter])

    // Filter + search
    const filteredEvents = useMemo(() => {
        if (!searchQuery) return events
        const q = searchQuery.toLowerCase()
        return events.filter(e =>
            e.event_type.toLowerCase().includes(q) ||
            String(e.bus_id).includes(q) ||
            e.severity.toLowerCase().includes(q)
        )
    }, [events, searchQuery])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE))
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, typeFilter, severityFilter])

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'HIGH': return <AlertCircle size={16} />
            case 'MEDIUM': return <AlertTriangle size={16} />
            default: return <Info size={16} />
        }
    }

    const formatEventType = (type: string) =>
        type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())

    const handleExport = () => {
        api.export.downloadEvents()
    }

    return (
        <>
            <Navbar />
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
                        className="events-header"
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
                                Event History
                            </h1>
                            <p style={{
                                fontSize: 'var(--text-body)',
                                color: 'var(--text-tertiary)'
                            }}>
                                {filteredEvents.length} events recorded
                            </p>
                        </div>

                        {/* Toolbar */}
                        <div className="events-toolbar">
                            {/* Type Filter */}
                            <div className="events-select-wrapper">
                                <select
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value as EventType | '')}
                                    className="events-select"
                                >
                                    {EVENT_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="events-select-icon" />
                            </div>

                            {/* Severity Filter */}
                            <div className="events-select-wrapper">
                                <select
                                    value={severityFilter}
                                    onChange={e => setSeverityFilter(e.target.value as EventSeverity | '')}
                                    className="events-select"
                                >
                                    {SEVERITY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="events-select-icon" />
                            </div>

                            {/* Search */}
                            <div className="events-search-wrapper">
                                <Search size={16} className="events-search-icon" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search events..."
                                    className="events-search-input"
                                />
                            </div>

                            {/* Export */}
                            <motion.button
                                className="events-export-btn"
                                onClick={handleExport}
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Download size={16} />
                                Export CSV
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* ─── EVENTS TABLE ─── */}
                    <motion.div
                        className="glass-card events-table-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        {isLoading ? (
                            <div className="events-loading">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="skeleton-text" style={{ height: '52px' }} />
                                ))}
                            </div>
                        ) : paginatedEvents.length === 0 ? (
                            <motion.div
                                className="events-empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Info size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
                                <p style={{
                                    fontSize: 'var(--text-title-3)',
                                    fontWeight: 'var(--weight-headline)',
                                    color: 'var(--text-secondary)',
                                    marginBottom: 'var(--space-2)'
                                }}>
                                    No events found
                                </p>
                                <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-tertiary)' }}>
                                    Try adjusting your filters or search query.
                                </p>
                            </motion.div>
                        ) : (
                            <>
                                <div className="events-table-scroll">
                                    <table className="events-table">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Bus</th>
                                                <th>Type</th>
                                                <th>Severity</th>
                                                <th>Speed</th>
                                                <th>Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence mode="popLayout">
                                                {paginatedEvents.map((event, index) => (
                                                    <motion.tr
                                                        key={event.id}
                                                        className="events-row"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ delay: index * 0.03, duration: 0.3 }}
                                                        onClick={() => setSelectedEvent(event)}
                                                        whileHover={{ x: 4 }}
                                                    >
                                                        <td>
                                                            <span className="events-time">
                                                                {new Date(event.timestamp).toLocaleTimeString()}
                                                            </span>
                                                            <span className="events-date">
                                                                {new Date(event.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="events-bus-badge">
                                                                🚌 {event.bus_registration || `Bus ${event.bus_id}`}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="events-type">
                                                                {formatEventType(event.event_type)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`severity-badge severity-badge--${event.severity.toLowerCase()}`}>
                                                                {getSeverityIcon(event.severity)}
                                                                {event.severity}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="events-speed">
                                                                {event.speed} <small>km/h</small>
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="events-location">
                                                                {event.latitude.toFixed(3)}°N, {event.longitude.toFixed(3)}°E
                                                            </span>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="events-pagination">
                                    <motion.button
                                        className="events-page-btn"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <ChevronLeft size={16} />
                                    </motion.button>

                                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                        let pageNum: number
                                        if (totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i
                                        } else {
                                            pageNum = currentPage - 2 + i
                                        }
                                        return (
                                            <motion.button
                                                key={pageNum}
                                                className={`events-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {pageNum}
                                            </motion.button>
                                        )
                                    })}

                                    <motion.button
                                        className="events-page-btn"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <ChevronRight size={16} />
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>

                {/* ─── EVIDENCE MODAL ─── */}
                <AnimatePresence>
                    {selectedEvent && (
                        <motion.div
                            className="evidence-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                        >
                            <motion.div
                                className="glass-card evidence-modal"
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Close */}
                                <motion.button
                                    className="evidence-close"
                                    onClick={() => setSelectedEvent(null)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={20} />
                                </motion.button>

                                {/* Evidence Image/Video */}
                                {(selectedEvent.snapshot_path || selectedEvent.video_path) && (
                                    <div className="evidence-media">
                                        {selectedEvent.video_path ? (
                                            <video
                                                src={selectedEvent.video_path}
                                                controls
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                                            />
                                        ) : (
                                            <img
                                                src={selectedEvent.snapshot_path}
                                                alt="Event evidence"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Event Details */}
                                <div className="evidence-details">
                                    <div className="evidence-header-row">
                                        <h3 style={{
                                            fontSize: 'var(--text-title-2)',
                                            fontWeight: 'var(--weight-title)',
                                            color: 'var(--text-primary)',
                                            letterSpacing: '-0.02em'
                                        }}>
                                            {formatEventType(selectedEvent.event_type)}
                                        </h3>
                                        <span className={`severity-badge severity-badge--${selectedEvent.severity.toLowerCase()}`}>
                                            {getSeverityIcon(selectedEvent.severity)}
                                            {selectedEvent.severity}
                                        </span>
                                    </div>

                                    <div className="evidence-grid">
                                        <div className="evidence-item">
                                            <Clock size={16} style={{ color: 'var(--text-tertiary)' }} />
                                            <div>
                                                <span className="evidence-label">Timestamp</span>
                                                <span className="evidence-value">
                                                    {new Date(selectedEvent.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="evidence-item">
                                            <span style={{ fontSize: '16px' }}>🚌</span>
                                            <div>
                                                <span className="evidence-label">Bus</span>
                                                <span className="evidence-value">{selectedEvent.bus_registration || `Bus ${selectedEvent.bus_id}`}</span>
                                            </div>
                                        </div>

                                        <div className="evidence-item">
                                            <Gauge size={16} style={{ color: 'var(--text-tertiary)' }} />
                                            <div>
                                                <span className="evidence-label">Speed</span>
                                                <span className="evidence-value">{selectedEvent.speed} km/h</span>
                                            </div>
                                        </div>

                                        <div className="evidence-item">
                                            <MapPin size={16} style={{ color: 'var(--text-tertiary)' }} />
                                            <div>
                                                <span className="evidence-label">Location</span>
                                                <span className="evidence-value">
                                                    {selectedEvent.latitude.toFixed(4)}°N, {selectedEvent.longitude.toFixed(4)}°E
                                                </span>
                                            </div>
                                        </div>

                                        {(selectedEvent.accel_x !== undefined) && (
                                            <div className="evidence-item" style={{ gridColumn: '1 / -1' }}>
                                                <Zap size={16} style={{ color: 'var(--text-tertiary)' }} />
                                                <div>
                                                    <span className="evidence-label">Acceleration</span>
                                                    <span className="evidence-value">
                                                        X={selectedEvent.accel_x?.toFixed(2)}g,{' '}
                                                        Y={selectedEvent.accel_y?.toFixed(2)}g,{' '}
                                                        Z={selectedEvent.accel_z?.toFixed(2)}g
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    )
}
