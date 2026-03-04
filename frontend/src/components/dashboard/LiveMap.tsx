/**
 * LiveMap — Interactive Leaflet fleet map with Swiggy-style smooth tracking
 *
 * Features:
 * - requestAnimationFrame interpolation — markers glide between GPS updates (no teleporting)
 * - Bus SVG icon with heading cone and radar pulse
 * - Bearing-based icon rotation (marker faces direction of travel)
 * - Fading trail polyline
 * - Floating glass control island
 * - CARTO Voyager (Light) basemap
 */

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, Plus, Minus, Navigation, AlertTriangle } from 'lucide-react'
import type { BusLocation, Event as EventType } from '@/types'
import { snapIncrementalTrail, clearMatchState } from '@/utils/osrmMatch'
import './LiveMap.css'

// ─── Bus SVG icon (fully self-contained, rotates with heading) ───────────────

const createBusIcon = (status: 'active' | 'idle' | 'offline', heading: number = 0, busId = 0) => {
    const isMoving = status === 'active'

    // Colour palette per status
    const roofTop = status === 'active' ? '#ff6b6b' : status === 'idle' ? '#fcd34d' : '#9ca3af'
    const roofBot = status === 'active' ? '#c0392b' : status === 'idle' ? '#f59e0b' : '#6b7280'
    const bodyColor = status === 'active' ? '#e74c3c' : status === 'idle' ? '#f59e0b' : '#6b7280'
    const bodyShade = status === 'active' ? '#96281b' : status === 'idle' ? '#b45309' : '#4b5563'
    const glowColor = status === 'active' ? 'rgba(231,76,60,0.55)' : 'none'
    const glassColor = '#a8d8f0'
    const uid = `bus${busId}` // unique gradient IDs per bus

    return L.divIcon({
        html: `
        <div class="bus-puck" style="transform:rotate(${heading}deg);">
            ${isMoving ? '<div class="bus-radar-pulse"></div>' : ''}
            <div class="bus-heading-cone"></div>

            <!-- 3D top-down bus icon -->
            <div style="
                filter: drop-shadow(0 5px 10px rgba(0,0,0,0.35))
                        drop-shadow(0 0 8px ${glowColor});
                transform: perspective(120px) rotateX(14deg);
                transform-origin: center bottom;
            ">
            <svg xmlns="http://www.w3.org/2000/svg"
                 width="32" height="44" viewBox="0 0 32 44">
              <defs>
                <!-- Roof gradient: highlight centre, dark edges -->
                <radialGradient id="${uid}roof" cx="50%" cy="42%" r="55%">
                  <stop offset="0%"   stop-color="${roofTop}"/>
                  <stop offset="100%" stop-color="${roofBot}"/>
                </radialGradient>
                <!-- Side body gradient for depth -->
                <linearGradient id="${uid}body" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stop-color="${bodyShade}"/>
                  <stop offset="30%"  stop-color="${bodyColor}"/>
                  <stop offset="100%" stop-color="${bodyShade}"/>
                </linearGradient>
                <!-- Window glass shimmer -->
                <linearGradient id="${uid}win" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stop-color="rgba(255,255,255,0.7)"/>
                  <stop offset="100%" stop-color="${glassColor}"/>
                </linearGradient>
              </defs>

              <!-- ── Drop shadow layer ── -->
              <rect x="5" y="4" width="22" height="36" rx="4"
                    fill="rgba(0,0,0,0.18)" transform="translate(1,3)"/>

              <!-- ── Main body (sides visible as thin strips) ── -->
              <rect x="3" y="4" width="26" height="36" rx="4"
                    fill="url(#${uid}body)"/>

              <!-- ── Roof panel ── -->
              <rect x="5" y="6" width="22" height="30" rx="3"
                    fill="url(#${uid}roof)"/>

              <!-- ── Roof specular highlight ── -->
              <ellipse cx="16" cy="17" rx="8" ry="5"
                       fill="rgba(255,255,255,0.22)"/>

              <!-- ── Front windshield ── -->
              <path d="M8 8 L24 8 L22 13 L10 13 Z"
                    fill="url(#${uid}win)" rx="1"/>
              <!-- Windshield divider -->
              <line x1="16" y1="8" x2="16" y2="13"
                    stroke="rgba(0,0,0,0.15)" stroke-width="0.6"/>

              <!-- ── Side windows (left column) ── -->
              <rect x="5" y="15" width="4" height="4" rx="0.8"
                    fill="url(#${uid}win)"/>
              <rect x="5" y="21" width="4" height="4" rx="0.8"
                    fill="url(#${uid}win)"/>
              <rect x="5" y="27" width="4" height="4" rx="0.8"
                    fill="url(#${uid}win)"/>

              <!-- ── Side windows (right column) ── -->
              <rect x="23" y="15" width="4" height="4" rx="0.8"
                    fill="url(#${uid}win)"/>
              <rect x="23" y="21" width="4" height="4" rx="0.8"
                    fill="url(#${uid}win)"/>
              <rect x="23" y="27" width="4" height="4" rx="0.8"
                    fill="url(#${uid}win)"/>

              <!-- ── Rear lights ── -->
              <rect x="6"  y="34" width="5" height="2.5" rx="1"
                    fill="rgba(255,200,0,0.9)"/>
              <rect x="21" y="34" width="5" height="2.5" rx="1"
                    fill="rgba(255,200,0,0.9)"/>

              <!-- ── Front lights (headlights) ── -->
              <rect x="6"  y="6" width="4" height="1.5" rx="0.5"
                    fill="rgba(255,255,220,0.95)"/>
              <rect x="22" y="6" width="4" height="1.5" rx="0.5"
                    fill="rgba(255,255,220,0.95)"/>

              <!-- ── Wheels ── -->
              <ellipse cx="7"  cy="10" rx="2.5" ry="3.5" fill="#1f2937"/>
              <ellipse cx="25" cy="10" rx="2.5" ry="3.5" fill="#1f2937"/>
              <ellipse cx="7"  cy="37" rx="2.5" ry="3.5" fill="#1f2937"/>
              <ellipse cx="25" cy="37" rx="2.5" ry="3.5" fill="#1f2937"/>
              <!-- Wheel shine -->
              <ellipse cx="7"  cy="10" rx="1.2" ry="1.8" fill="#4b5563"/>
              <ellipse cx="25" cy="10" rx="1.2" ry="1.8" fill="#4b5563"/>
              <ellipse cx="7"  cy="37" rx="1.2" ry="1.8" fill="#4b5563"/>
              <ellipse cx="25" cy="37" rx="1.2" ry="1.8" fill="#4b5563"/>
            </svg>
            </div>
        </div>
        `,
        className: 'custom-bus-marker',
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        popupAnchor: [0, -26]
    })
}

// ─── Bearing between two lat/lng points (degrees 0-360) ──────────────────────

function calcBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180
    const dLng = toRad(lng2 - lng1)
    const φ1 = toRad(lat1)
    const φ2 = toRad(lat2)
    const y = Math.sin(dLng) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng)
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// ─── Zoom-adaptive trail weights (Google Maps style) ─────────────────────────
// Google Maps keeps its route line clearly visible at every zoom level.
// We scale polyline weight based on zoom: thick at street level, still
// prominent at city/region level.

function trailWeights(zoom: number) {
    // zoom 8 → region,  10 → city,  13 → district,  15 → street,  18 → building
    if (zoom >= 16) return { border: 14, fill: 10, raw: 8 }
    if (zoom >= 14) return { border: 12, fill: 8, raw: 6 }
    if (zoom >= 12) return { border: 10, fill: 7, raw: 5 }
    if (zoom >= 10) return { border: 8, fill: 6, raw: 4 }
    if (zoom >= 8)  return { border: 6, fill: 4, raw: 3 }
    return { border: 5, fill: 3, raw: 2 }
}

// ─── Per-bus animation state ──────────────────────────────────────────────────

interface BusAnimState {
    // Current rendered position (updated every rAF tick)
    curLat: number
    curLng: number
    // Target position from latest server update
    tgtLat: number
    tgtLng: number
    // Timestamps for interpolation
    animStart: number
    animDuration: number // ms — matches SIMULATION_INTERVAL
    heading: number
    status: 'active' | 'idle' | 'offline'
    // Leaflet references
    marker: L.Marker | null
    rafId: number | null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LiveMapProps {
    buses: BusLocation[]
    events?: EventType[]
    height?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveMap({ buses, events = [], height = 480 }: LiveMapProps) {
    const mapRef = useRef<L.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markersRef = useRef<Map<number, L.Marker>>(new Map())
    const eventMarkersRef = useRef<Map<number, L.Marker>>(new Map())
    const pathsRef = useRef<Map<number, L.Polyline>>(new Map())
    const snappedPathsRef = useRef<Map<number, L.Polyline>>(new Map())
    const snappedBorderRef = useRef<Map<number, L.Polyline>>(new Map())
    const pathHistoryRef = useRef<Map<number, [number, number][]>>(new Map())
    const animStateRef = useRef<Map<number, BusAnimState>>(new Map())

    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showEvents, setShowEvents] = useState(true)
    const focusIndexRef = useRef(0)
    // Always reflects the latest buses prop so stale closures (e.g. click handlers)
    // can still read current data without being re-created on every render
    const busesRef = useRef(buses)
    useEffect(() => { busesRef.current = buses }, [buses])
    const eventTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

    // ── Event markers (auto-expire, max 5 visible, smaller icons) ────────────
    useEffect(() => {
        if (!mapRef.current) return
        const map = mapRef.current
        const currentEventMarkers = eventMarkersRef.current

        // Toggle visibility — remove all when hidden
        if (!showEvents) {
            currentEventMarkers.forEach(m => m.remove())
            return
        }

        const importantEvents = events.filter(e => e.severity === 'HIGH' || e.severity === 'MEDIUM')
        // Only show the latest 5 events on the map to prevent clutter
        const recentEvents = importantEvents.slice(0, 5)
        const recentIds = new Set(recentEvents.map(e => e.id))

        recentEvents.forEach(event => {
            if (currentEventMarkers.has(event.id)) {
                // Re-add to map if it was hidden by toggle
                if (!map.hasLayer(currentEventMarkers.get(event.id)!)) {
                    currentEventMarkers.get(event.id)!.addTo(map)
                }
                return
            }

            const isHigh = event.severity === 'HIGH'
            const icon = L.divIcon({
                html: `
                    <div class="event-pip ${isHigh ? 'event-pip-high' : 'event-pip-med'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                             fill="none" stroke="white" stroke-width="3"
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>`,
                className: 'event-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
            const marker = L.marker([event.latitude, event.longitude], { icon, zIndexOffset: -100 })
            marker.bindPopup(`
                <div class="glass-popup-content">
                    <div class="glass-popup-header">
                        <div class="glass-popup-title">${event.event_type.replace(/_/g, ' ')}</div>
                        <div class="glass-popup-badge ${isHigh ? 'live' : 'idle'}">${event.severity}</div>
                    </div>
                    <div class="glass-popup-row">
                        <span>Bus:</span>
                        <span style="color:var(--text-primary);font-weight:500">${event.bus_registration || event.bus_id}</span>
                    </div>
                    <div class="glass-popup-row">
                        <span>Time:</span>
                        <span>${new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            `, { className: 'glass-popup', closeButton: false })
            marker.addTo(map)
            currentEventMarkers.set(event.id, marker)

            // Auto-expire: remove after 15 seconds
            const timer = setTimeout(() => {
                marker.remove()
                currentEventMarkers.delete(event.id)
                eventTimersRef.current.delete(event.id)
            }, 15000)
            eventTimersRef.current.set(event.id, timer)
        })

        // Remove markers not in the latest 5
        currentEventMarkers.forEach((marker, id) => {
            if (!recentIds.has(id)) {
                marker.remove()
                currentEventMarkers.delete(id)
                const timer = eventTimersRef.current.get(id)
                if (timer) { clearTimeout(timer); eventTimersRef.current.delete(id) }
            }
        })
    }, [events, showEvents])

    // ── Map initialisation ───────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const map = L.map(mapContainerRef.current, {
            center: [8.9312, 76.6141], // Kollam — centre of our routes
            zoom: 10,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: true
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 20
        }).addTo(map)

        mapRef.current = map

        // ── Zoom-adaptive trail thickness ─────────────────────────────────
        const updateTrailWeights = () => {
            const z = map.getZoom()
            const w = trailWeights(z)
            pathsRef.current.forEach(p => p.setStyle({ weight: w.raw }))
            snappedBorderRef.current.forEach(p => p.setStyle({ weight: w.border }))
            snappedPathsRef.current.forEach(p => p.setStyle({ weight: w.fill }))
        }
        map.on('zoomend', updateTrailWeights)

        return () => {
            // Cancel all running animations
            animStateRef.current.forEach(s => {
                if (s.rafId !== null) cancelAnimationFrame(s.rafId)
            })
            map.remove()
            mapRef.current = null
        }
    }, [])

    // ── Swiggy-style smooth marker update ────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current) return
        const map = mapRef.current

        buses.forEach(bus => {
            const anim = animStateRef.current.get(bus.bus_id)
            const existingMarker = markersRef.current.get(bus.bus_id)

            // ── First time seeing this bus ─────────────────────────────────
            if (!anim || !existingMarker) {
                // Bus reconnected after a trip — clear the previous trip's trail
                // so the new trip starts with a clean slate
                const oldPath = pathsRef.current.get(bus.bus_id)
                if (oldPath) { oldPath.remove(); pathsRef.current.delete(bus.bus_id) }
                const oldBorder = snappedBorderRef.current.get(bus.bus_id)
                if (oldBorder) { oldBorder.remove(); snappedBorderRef.current.delete(bus.bus_id) }
                const oldSnapped = snappedPathsRef.current.get(bus.bus_id)
                if (oldSnapped) { oldSnapped.remove(); snappedPathsRef.current.delete(bus.bus_id) }
                pathHistoryRef.current.delete(bus.bus_id)
                clearMatchState(bus.bus_id)

                const icon = createBusIcon(bus.status, bus.heading ?? 0, bus.bus_id)
                const marker = L.marker([bus.latitude, bus.longitude], { icon })

                const buildPopup = (b: typeof bus) => `
                        <div class="glass-popup-content">
                            <div class="glass-popup-header">
                                <div class="glass-popup-title">Bus ${b.registration_number || b.bus_id}</div>
                                <div class="glass-popup-badge live">LIVE</div>
                            </div>
                            <div class="glass-popup-row">
                                <span style="opacity:.7">Driver:</span>
                                <span style="color:var(--text-primary);font-weight:500">${b.driver_name || 'N/A'}</span>
                            </div>
                            <div class="glass-popup-row">
                                <span style="opacity:.7">Speed:</span>
                                <span style="color:var(--text-primary);font-weight:500">${Math.round(b.speed)} km/h</span>
                            </div>
                        </div>`
                // Store the builder on the marker so handleRecenter can reuse it
                ;(marker as any)._buildPopup = () => {
                    const latest = busesRef.current.find(x => x.bus_id === bus.bus_id) || bus
                    return buildPopup(latest)
                }
                marker.bindPopup(buildPopup(bus), { className: 'glass-popup', closeButton: false })
                marker.on('click', () => {
                    marker.setPopupContent((marker as any)._buildPopup())
                })

                marker.addTo(map)
                markersRef.current.set(bus.bus_id, marker)

                animStateRef.current.set(bus.bus_id, {
                    curLat: bus.latitude,
                    curLng: bus.longitude,
                    tgtLat: bus.latitude,
                    tgtLng: bus.longitude,
                    animStart: performance.now(),
                    animDuration: 2000, // matches SIMULATION_INTERVAL
                    heading: bus.heading ?? 0,
                    status: bus.status,
                    marker,
                    rafId: null
                })
                return
            }

            // ── Subsequent update — start interpolation ────────────────────
            const prevLat = anim.curLat
            const prevLng = anim.curLng

            // Calculate bearing from last rendered position to new target
            const bearing =
                prevLat !== bus.latitude || prevLng !== bus.longitude
                    ? calcBearing(prevLat, prevLng, bus.latitude, bus.longitude)
                    : anim.heading

            // Cancel any running animation
            if (anim.rafId !== null) cancelAnimationFrame(anim.rafId)

            anim.tgtLat = bus.latitude
            anim.tgtLng = bus.longitude
            anim.animStart = performance.now()
            anim.animDuration = 2000
            anim.heading = bearing
            anim.status = bus.status

            // Update icon to reflect new heading / status immediately
            existingMarker.setIcon(createBusIcon(bus.status, bearing, bus.bus_id))

            // ── rAF interpolation loop ─────────────────────────────────────
            const startLat = anim.curLat
            const startLng = anim.curLng

            const tick = (now: number) => {
                const elapsed = now - anim.animStart
                const t = Math.min(elapsed / anim.animDuration, 1) // 0 → 1

                // Ease-out cubic for natural deceleration
                const ease = 1 - Math.pow(1 - t, 3)

                const lat = startLat + (anim.tgtLat - startLat) * ease
                const lng = startLng + (anim.tgtLng - startLng) * ease

                anim.curLat = lat
                anim.curLng = lng
                existingMarker.setLatLng([lat, lng])

                // ── Update trail (full journey, road-snapped Google Maps style) ──
                const history = pathHistoryRef.current
                if (!history.has(bus.bus_id)) history.set(bus.bus_id, [])
                const busPath = history.get(bus.bus_id)!
                const last = busPath[busPath.length - 1]
                if (!last || last[0] !== lat || last[1] !== lng) {
                    busPath.push([lat, lng])
                    // NO cap — full journey from start
                }

                // Draw the raw trail (fallback — visible until snapped trail is ready)
                const existingPath = pathsRef.current.get(bus.bus_id)
                if (existingPath) {
                    existingPath.setLatLngs(busPath)
                } else if (busPath.length > 1) {
                    const w = trailWeights(map.getZoom())
                    const poly = L.polyline(busPath, {
                        color: '#60a5fa',
                        weight: w.raw,
                        opacity: 0.5,
                        lineCap: 'round',
                        lineJoin: 'round',
                        className: 'bus-trail bus-trail-raw'
                    }).addTo(map)
                    pathsRef.current.set(bus.bus_id, poly)
                }

                // Trigger incremental OSRM road-snap (async, throttled)
                // Sends only new points, accumulates the full journey snapped geometry
                if (busPath.length >= 5 && t >= 1) {
                    const pathCopy: [number, number][] = [...busPath]
                    snapIncrementalTrail(bus.bus_id, pathCopy).then(fullSnapped => {
                        if (!fullSnapped || !mapRef.current) return

                        // Border polyline (dark, wide — creates the outline)
                        const curZoom = mapRef.current.getZoom()
                        const w = trailWeights(curZoom)
                        const existingBorder = snappedBorderRef.current.get(bus.bus_id)
                        if (existingBorder) {
                            existingBorder.setLatLngs(fullSnapped)
                        } else {
                            const border = L.polyline(fullSnapped, {
                                color: '#1e40af',
                                weight: w.border,
                                opacity: 0.55,
                                lineCap: 'round',
                                lineJoin: 'round',
                                className: 'bus-trail bus-trail-border'
                            }).addTo(mapRef.current)
                            snappedBorderRef.current.set(bus.bus_id, border)
                        }

                        // Fill polyline (lighter, on top — the main visible trail)
                        const existingSnapped = snappedPathsRef.current.get(bus.bus_id)
                        if (existingSnapped) {
                            existingSnapped.setLatLngs(fullSnapped)
                        } else {
                            const fill = L.polyline(fullSnapped, {
                                color: '#4a90ff',
                                weight: w.fill,
                                opacity: 0.9,
                                lineCap: 'round',
                                lineJoin: 'round',
                                className: 'bus-trail bus-trail-snapped'
                            }).addTo(mapRef.current)
                            snappedPathsRef.current.set(bus.bus_id, fill)
                        }

                        // Hide the raw fallback trail once road-snapped is visible
                        const rawPath = pathsRef.current.get(bus.bus_id)
                        if (rawPath) rawPath.setStyle({ opacity: 0.0 })
                    })
                }

                if (t < 1) {
                    anim.rafId = requestAnimationFrame(tick)
                } else {
                    anim.rafId = null
                }
            }

            anim.rafId = requestAnimationFrame(tick)
        })

        // ── Cleanup removed buses ──────────────────────────────────────────
        // Remove the bus marker + animation state, but KEEP trail polylines
        // on the map so the route stays visible after the trip ends.
        // Trails are only cleared when the same bus_id reconnects (new trip).
        markersRef.current.forEach((marker, busId) => {
            if (!buses.find(b => b.bus_id === busId)) {
                const anim = animStateRef.current.get(busId)
                if (anim?.rafId !== null && anim?.rafId !== undefined) {
                    cancelAnimationFrame(anim.rafId)
                }
                marker.remove()
                markersRef.current.delete(busId)
                animStateRef.current.delete(busId)
                // trails (pathsRef, snappedBorderRef, snappedPathsRef) stay on map
            }
        })
    }, [buses])

    // ── Controls ─────────────────────────────────────────────────────────────
    const handleZoomIn = () => mapRef.current?.zoomIn()
    const handleZoomOut = () => mapRef.current?.zoomOut()
    // Reset focus index whenever the number of buses changes so stale indices
    // don't cycle into non-existent slots (e.g. after simulator stops)
    const prevBusCountRef = useRef(buses.length)
    useEffect(() => {
        if (buses.length !== prevBusCountRef.current) {
            focusIndexRef.current = 0
            prevBusCountRef.current = buses.length
        }
    }, [buses.length])

    const handleRecenter = () => {
        if (buses.length === 0 || !mapRef.current) return

        // Clamp first in case the array shrank mid-session, then cycle
        focusIndexRef.current = focusIndexRef.current % buses.length
        const idx = focusIndexRef.current
        const bus = buses[idx]
        focusIndexRef.current = (idx + 1) % buses.length

        // Pan to the bus while keeping the user's current zoom level
        const currentZoom = mapRef.current.getZoom()
        mapRef.current.flyTo([bus.latitude, bus.longitude], currentZoom, {
            duration: 0.6,
        })

        // Populate then open the popup for the focused bus
        const marker = markersRef.current.get(bus.bus_id)
        if (marker) {
            if ((marker as any)._buildPopup) {
                marker.setPopupContent((marker as any)._buildPopup())
            }
            marker.openPopup()
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
            <div ref={mapContainerRef} className="map-container" />

            {/* Floating Control Island */}
            <div className="map-controls-island">
                <motion.button
                    className="control-pill"
                    onClick={handleRecenter}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={buses.length > 1 ? `Focus bus (${(focusIndexRef.current % buses.length) + 1}/${buses.length})` : buses.length === 1 ? 'Focus bus' : 'No active buses'}
                >
                    <Navigation size={18} />
                </motion.button>

                <motion.button
                    className={`control-pill ${showEvents ? 'control-pill-active' : ''}`}
                    onClick={() => setShowEvents(prev => !prev)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={showEvents ? 'Hide event markers' : 'Show event markers'}
                >
                    <AlertTriangle size={18} />
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
