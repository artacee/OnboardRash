/**
 * LiveMap — Interactive Leaflet fleet map with glass-styled markers
 * 
 * Features:
 * - CARTO Positron light basemap
 * - Custom glass bus markers with status colors
 * - Fullscreen toggle + layer selector
 * - Live vehicle count badge
 */

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2 } from 'lucide-react'
import type { BusLocation } from '@/types'

// Custom glass-styled bus marker
const createBusIcon = (status: 'active' | 'idle' | 'offline') => {
    const colors = {
        active: '#34d399',
        idle: '#fbbf24',
        offline: '#f87171'
    }

    return L.divIcon({
        html: `
      <div style="
        width: 32px;
        height: 32px;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(12px);
        border: 2px solid ${colors[status]};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-size: 18px;
      ">
        🚌
      </div>
    `,
        className: 'custom-bus-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    })
}

interface LiveMapProps {
    buses: BusLocation[]
    height?: number
}

export default function LiveMap({ buses, height = 480 }: LiveMapProps) {
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markersRef = useRef<Map<number, L.Marker>>(new Map())

    const [isFullscreen, setIsFullscreen] = useState(false)

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const map = L.map(mapContainerRef.current, {
            center: [8.5241, 76.9366], // Trivandrum default
            zoom: 12,
            zoomControl: false,
            attributionControl: false
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 19
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        mapRef.current = map

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [])

    // Update bus markers
    useEffect(() => {
        if (!mapRef.current) return

        const map = mapRef.current
        const currentMarkers = markersRef.current

        buses.forEach(bus => {
            const existingMarker = currentMarkers.get(bus.bus_id)

            if (existingMarker) {
                existingMarker.setLatLng([bus.latitude, bus.longitude])
            } else {
                const marker = L.marker(
                    [bus.latitude, bus.longitude],
                    { icon: createBusIcon(bus.status) }
                )

                marker.bindPopup(`
          <div style="font-family: var(--font-body); font-size: 13px; line-height: 1.6; padding: 4px;">
            <strong style="display:block; margin-bottom:4px;">${bus.registration_number || `Bus ${bus.bus_id}`}</strong>
            Speed: ${bus.speed} km/h<br>
            Driver: ${bus.driver_name || 'Unknown'}<br>
            Last update: ${new Date(bus.timestamp).toLocaleTimeString()}
          </div>
        `)

                marker.addTo(map)
                currentMarkers.set(bus.bus_id, marker)
            }
        })

        // Remove stale markers
        currentMarkers.forEach((marker, busId) => {
            if (!buses.find(b => b.bus_id === busId)) {
                marker.remove()
                currentMarkers.delete(busId)
            }
        })
    }, [buses])

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
        <div className="map-wrapper" style={{ position: 'relative' }}>
            <div
                ref={mapContainerRef}
                style={{
                    height: `${height}px`,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            />

            {/* Glass Control Overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 'var(--space-4)',
                    right: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    zIndex: 1000
                }}
            >
                <motion.button
                    className="glass-nested map-control-btn"
                    onClick={toggleFullscreen}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        background: 'var(--glass-t2-bg)',
                        backdropFilter: 'var(--glass-t2-blur)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </motion.button>
            </div>

            {/* Bus Count Badge */}
            <motion.div
                className="glass-nested"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                style={{
                    position: 'absolute',
                    bottom: 'var(--space-4)',
                    left: 'var(--space-4)',
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: 'var(--text-footnote)',
                    fontWeight: 'var(--weight-headline)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        width: '6px',
                        height: '6px',
                        background: 'var(--color-info)',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px var(--color-info)'
                    }}
                />
                <span>{buses.length} vehicles</span>
            </motion.div>
        </div>
    )
}
