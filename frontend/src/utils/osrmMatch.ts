/**
 * OSRM Map Matching Utility — Incremental Snapping
 *
 * Snaps raw GPS point traces to actual road geometry using the free
 * OSRM Match API (https://router.project-osrm.org).
 *
 * Key design: instead of re-snapping the entire trail each time, it tracks
 * which points have already been snapped and only sends NEW segments to the
 * API for matching.  The matched geometry is **accumulated** so the full
 * journey trail (from start to current position) is always available.
 */

const OSRM_BASE = 'https://router.project-osrm.org'

/** Minimum new points before we trigger a match request */
const MIN_NEW_POINTS = 4
/** Maximum points per OSRM request (API limit is 100) */
const MAX_POINTS = 80
/** Minimum ms between match calls for the same bus */
const THROTTLE_MS = 3500

// ── Per-bus state ─────────────────────────────────────────────────────────────

interface BusSnapState {
  /** Accumulated road-snapped geometry for the entire journey */
  snappedTrail: [number, number][]
  /** Index into the raw path indicating where we last snapped up to */
  lastSnappedIdx: number
  /** Timestamp of last API call */
  lastCallTime: number
}

const busState = new Map<number, BusSnapState>()

function getState(busId: number): BusSnapState {
  if (!busState.has(busId)) {
    busState.set(busId, {
      snappedTrail: [],
      lastSnappedIdx: 0,
      lastCallTime: 0,
    })
  }
  return busState.get(busId)!
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Incrementally snap the latest portion of a bus's raw GPS trail to road geometry.
 *
 * Call this frequently with the FULL raw path.  Internally it figures out which
 * segment is new, matches only that via OSRM, and appends to the accumulated
 * snapped trail.
 *
 * @param busId      Bus identifier
 * @param fullRawPath  The COMPLETE raw trail from journey start: [lat, lng][]
 * @returns The full accumulated snapped trail, or null if nothing new was matched
 */
export async function snapIncrementalTrail(
  busId: number,
  fullRawPath: [number, number][]
): Promise<[number, number][] | null> {
  const state = getState(busId)
  const now = Date.now()

  // Throttle
  if (now - state.lastCallTime < THROTTLE_MS) return null

  // How many new unsnapped points do we have?
  const newCount = fullRawPath.length - state.lastSnappedIdx
  if (newCount < MIN_NEW_POINTS) return null

  // Take the segment that needs snapping.
  // Include a small overlap (3 pts) with already-snapped region for continuity.
  const overlapStart = Math.max(0, state.lastSnappedIdx - 3)
  let segment = fullRawPath.slice(overlapStart)

  // Trim to API limit
  if (segment.length > MAX_POINTS) {
    segment = segment.slice(-MAX_POINTS)
  }

  // Build OSRM coordinate string: lng,lat;lng,lat;...
  const coordStr = segment.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const radiuses = segment.map(() => '30').join(';')
  const url = `${OSRM_BASE}/match/v1/driving/${coordStr}?overview=full&geometries=geojson&radiuses=${radiuses}`

  try {
    state.lastCallTime = now

    const resp = await fetch(url)
    if (!resp.ok) return null

    const data = await resp.json()
    if (data.code !== 'Ok' || !data.matchings?.length) return null

    // Extract matched road geometry
    const newMatched: [number, number][] = []
    for (const matching of data.matchings) {
      const coords: [number, number][] = matching.geometry.coordinates
      for (const [lng, lat] of coords) {
        newMatched.push([lat, lng])
      }
    }

    if (newMatched.length === 0) return null

    // Append to accumulated snapped trail
    // If we have existing trail, find where the new segment connects
    // (skip duplicate points at the junction)
    if (state.snappedTrail.length > 0) {
      const lastExisting = state.snappedTrail[state.snappedTrail.length - 1]
      let startIdx = 0
      // Skip new points that are very close to the tail of existing trail
      for (let i = 0; i < Math.min(newMatched.length, 10); i++) {
        const d = Math.abs(newMatched[i][0] - lastExisting[0]) + Math.abs(newMatched[i][1] - lastExisting[1])
        if (d < 0.0001) {  // ~11m
          startIdx = i + 1
        }
      }
      state.snappedTrail.push(...newMatched.slice(startIdx))
    } else {
      state.snappedTrail.push(...newMatched)
    }

    // Update the cursor so we know where we snapped up to
    state.lastSnappedIdx = fullRawPath.length

    return state.snappedTrail
  } catch {
    return null
  }
}

/**
 * Get the current accumulated snapped trail for a bus (without making an API call).
 */
export function getSnappedTrail(busId: number): [number, number][] {
  return getState(busId).snappedTrail
}

/**
 * Clear all match state for a bus (when bus goes offline / is removed).
 */
export function clearMatchState(busId: number): void {
  busState.delete(busId)
}
