/**
 * LiveMap — Interactive Leaflet fleet map with Apple Maps-style glass aesthetics
 * 
 * Features:
 * - CARTO Voyager (Light) basemap
 * - Premium "Puck" markers with heading cones and radar pulses
 * - Floating glass control island
 * - Smooth CSS-based transitions
 */

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, Plus, Minus, Navigation } from 'lucide-react'
import type { BusLocation, Event as EventType } from '@/types'
import './LiveMap.css'

// Custom "Puck" Marker for Apple Maps feel
const createBusIcon = (status: 'active' | 'idle' | 'offline', heading: number = 0) => {
    const isMoving = status === 'active';

    return L.divIcon({
        html: `
        <div class="bus-puck">
            <div class="bus-heading-cone" style="transform: translate(-50%, -50%) rotate(${heading}deg);"></div>
            <div class="bus-radar-pulse" style="display: ${isMoving ? 'block' : 'none'}"></div>
            <div class="bus-glass-body">
                <div class="bus-status-dot ${status}"></div>
            </div>
        </div>
        `,
        className: 'custom-bus-marker', // Transition handled in CSS
        iconSize: [44, 44],
        iconAnchor: [22, 22], // Center of the puck
        popupAnchor: [0, -22]
    })
}

interface LiveMapProps {
    buses: BusLocation[]
    events?: EventType[]
    height?: number
}

export default function LiveMap({ buses, events = [], height = 480 }: LiveMapProps) {
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markersRef = useRef<Map<number, L.Marker>>(new Map())
    const eventMarkersRef = useRef<Map<number, L.Marker>>(new Map())
    const pathsRef = useRef<Map<number, L.Polyline>>(new Map())
    const pathHistoryRef = useRef<Map<number, [number, number][]>>(new Map())

    const [isFullscreen, setIsFullscreen] = useState(false)

    // Update Event Markers
    useEffect(() => {
        if (!mapRef.current) return
        const map = mapRef.current
        const currentEventMarkers = eventMarkersRef.current

        // Filter for high/medium severity events only
        const importantEvents = events.filter(e => e.severity === 'HIGH' || e.severity === 'MEDIUM')

        importantEvents.forEach(event => {
            if (currentEventMarkers.has(event.id)) return

            const icon = L.divIcon({
                html: `
                    <div style="
                        width: 32px; 
                        height: 32px; 
                        background: ${event.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.95)'};
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                        animation: pulse 2s infinite;
                    ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                `,
                className: 'event-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })

            const marker = L.marker([event.latitude, event.longitude], { icon })

            marker.bindPopup(`
                <div class="glass-popup-content">
                    <div class="glass-popup-header">
                        <div class="glass-popup-title">${event.event_type.replace(/_/g, ' ')}</div>
                        <div class="glass-popup-badge ${event.severity === 'HIGH' ? 'live' : 'idle'}">${event.severity}</div>
                    </div>
                    <div class="glass-popup-row">
                        <span>Bus:</span>
                        <span style="color: var(--text-primary); font-weight: 500;">${event.bus_registration || event.bus_id}</span>
                    </div>
                    <div class="glass-popup-row">
                        <span>Time:</span>
                        <span>${new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            `, {
                className: 'glass-popup',
                closeButton: false
            })

            marker.addTo(map)
            currentEventMarkers.set(event.id, marker)
        })

        currentEventMarkers.forEach((marker, id) => {
            if (!importantEvents.find(e => e.id === id)) {
                marker.remove()
                currentEventMarkers.delete(id)
            }
        })

    }, [events])

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const map = L.map(mapContainerRef.current, {
            center: [8.5241, 76.9366], // Trivandrum default
            zoom: 13,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false // Prevent page scroll hijack
        })

        // CARTO Voyager (Light, Clean, Apple Maps-ish)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 20
        }).addTo(map)

        // Inject smooth interaction styles for Leaflet internals if needed
        const style = document.createElement('style')
        style.innerHTML = `
            .leaflet-marker-icon {
                transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
            }
        `
        document.head.appendChild(style)

        mapRef.current = map

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [])

    // Update bus markers & trails
    useEffect(() => {
        if (!mapRef.current) return

        const map = mapRef.current
        const currentMarkers = markersRef.current
        const currentPaths = pathsRef.current
        const history = pathHistoryRef.current

        buses.forEach(bus => {
            const existingMarker = currentMarkers.get(bus.bus_id)
            const icon = createBusIcon(bus.status, bus.heading)

            // Update History
            if (!history.has(bus.bus_id)) {
                history.set(bus.bus_id, [])
            }
            const busPath = history.get(bus.bus_id)!

            // Only add point if it's different
            const lastPoint = busPath[busPath.length - 1]
            if (!lastPoint || lastPoint[0] !== bus.latitude || lastPoint[1] !== bus.longitude) {
                busPath.push([bus.latitude, bus.longitude])
                // Shorter tail for cleaner look
                if (busPath.length > 15) busPath.shift()
            }

            // Draw/Update Trail
            let existingPath = currentPaths.get(bus.bus_id)
            if (busPath.length > 1) {
                if (existingPath) {
                    existingPath.setLatLngs(busPath)
                } else {
                    existingPath = L.polyline(busPath, {
                        color: '#34d399', // Emerald
                        weight: 5,
                        opacity: 0.4,
                        lineCap: 'round',
                        lineJoin: 'round',
                        className: 'bus-trail'
                    }).addTo(map)
                    currentPaths.set(bus.bus_id, existingPath)
                }
            }

            // Update Marker
            if (existingMarker) {
                existingMarker.setLatLng([bus.latitude, bus.longitude])
                existingMarker.setIcon(icon) // Update icon to reflect heading change
            } else {
                const marker = L.marker(
                    [bus.latitude, bus.longitude],
                    { icon }
                )

                marker.bindPopup(`
                    <div class="glass-popup-content">
                        <div class="glass-popup-header">
                            <div class="glass-popup-title">Bus ${bus.bus_id}</div>
                            <div class="glass-popup-badge live">LIVE</div>
                        </div>
                         <div class="glass-popup-row">
                            <span style="opacity: 0.7;">Driver:</span>
                            <span style="color: var(--text-primary); font-weight: 500;">${bus.driver_name || 'N/A'}</span>
                        </div>
                        <div class="glass-popup-row">
                            <span style="opacity: 0.7;">Speed:</span>
                            <span style="color: var(--text-primary); font-weight: 500;">${Math.round(bus.speed)} km/h</span>
                        </div>
                    </div>
                `, {
                    className: 'glass-popup',
                    closeButton: false
                })

                marker.addTo(map)
                currentMarkers.set(bus.bus_id, marker)
            }
        })

        // Cleanup
        currentMarkers.forEach((marker, busId) => {
            if (!buses.find(b => b.bus_id === busId)) {
                marker.remove()
                currentMarkers.delete(busId)

                const path = currentPaths.get(busId)
                if (path) {
                    path.remove()
                    currentPaths.delete(busId)
                }
                history.delete(busId)
            }
        })
    }, [buses])

    const handleZoomIn = () => mapRef.current?.zoomIn()
    const handleZoomOut = () => mapRef.current?.zoomOut()
    const handleRecenter = () => {
        if (buses.length > 0 && mapRef.current) {
            const group = L.featureGroup(Array.from(markersRef.current.values()))
            mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] })
        }
    }

    const toggleFullscreen = () => {
        if (!mapContainerRef.current) return
        if (!isFullscreen) {
            mapContainerRef.current.requestFullscreen?.()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen?.()
            setIsFullscreen(false)
        }
    }

    return (
        <div className="map-wrapper" style={{ height: isFullscreen ? '100vh' : `${height}px` }}>
            <div
                ref={mapContainerRef}
                className="map-container"
            />

            {/* Floating Control Island */}
            <div className="map-controls-island">
                <motion.button
                    className="control-pill"
                    onClick={handleRecenter}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Recenter Map"
                >
                    <Navigation size={18} />
                </motion.button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <motion.button
                        className="control-pill"
                        onClick={handleZoomIn}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Zoom In"
                    >
                        <Plus size={18} />
                    </motion.button>
                    <motion.button
                        className="control-pill"
                        onClick={handleZoomOut}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Zoom Out"
                    >
                        <Minus size={18} />
                    </motion.button>
                </div>

                <motion.button
                    className="control-pill"
                    onClick={toggleFullscreen}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Toggle Fullscreen"
                    style={{ marginTop: 'var(--space-2)' }}
                >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </motion.button>
            </div>

            {/* Bus Count Badge */}
            <div className="bus-count-badge">
                <div className="pulse-dot" />
                <span>{buses.length} active vehicles</span>
            </div>
        </div>
    )
}
