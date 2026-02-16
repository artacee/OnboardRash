# OnboardRash Frontend — Quick Reference
> Condensed companion to `frontend_implementation_guide.md` (5088 lines)
> 📄 = "See main guide lines X–Y for full details"

---

## 1. Project Overview
📄 **L38–95**

**What**: Real-time rash driving detection dashboard for fleet management.  
**Stack**: React 19 + TypeScript + Vite · Framer Motion · Socket.IO · Leaflet · Lucide Icons  
**Architecture**: Raspberry Pi (sensors) → Flask backend (REST + Socket.IO + SQLite) → React frontend (this)

### Functional Requirements
1. Live Map (Leaflet, 10s refresh)
2. Real-time Alerts (Socket.IO WebSocket)
3. Events Table (filterable, paginated, evidence viewer)
4. Stats Cards (today's events, active buses, high severity)
5. CSV Export
6. Evidence Viewer (snapshot/video modal)
7. Audio Alerts (HIGH severity beep)

### Visual Summary

| Element | Value |
|---------|-------|
| Background | `#f5f7fa` + 4 animated pastel orbs |
| Glass | White semi-transparent (70%) + 60px blur |
| Text | Dark `rgba(0,0,0,0.95)` |
| Shadows | Soft (0.08–0.12 opacity) |
| Page Windows | Floating glass, 40px margins |
| Transitions | Slide/scale/fade (500ms) via Framer Motion |
| Material Tiers | T0 (70%) → T1 (50%) → T2 (35%) → T3 (60%) |

---

## 2. Design Philosophy
📄 **L149–313**

### The #1 Rule
> Every **PAGE** is a **WINDOW** — wrapped in a floating glass container with margins, shadows, and animated transitions.

### 3-Layer Structure
```
Layer 1: Animated Background (#f5f7fa + 4 gradient orbs + noise)    → fixed
Layer 2: Page Window (Tier 0 glass, 40px margins, 60px blur)        → per-page
Layer 3: Content (Tier 1–3 components inside window)                 → cards, tables
```

### 8 Core Principles (from Apple HIG)
1. Adaptive Materials — blur + saturate adjusts
2. Depth Hierarchy — layered shadows, parallax
3. One Glass Sheet Per View — avoid stacking
4. Specular Edge Highlights — `::before`/`::after` 1px light catches
5. Spatial Typography — bolder weights (Body=500, Title=700)
6. Comfortable Ergonomics — max-width 1400px
7. Physics-Based Motion — spring/cubic-bezier easing
8. Purposeful Depth — depth = importance

📄 Full principles table: **L196–205**  
📄 Specular highlight CSS: **L256–291**  
📄 Awwwards techniques table: **L295–304**

---

## 3. Design System
📄 **L315–620**

### 3.1 Color Tokens
📄 CSS variables: **L319–452**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#f5f7fa` | Page background |
| `--glass-t0-bg` | `rgba(255,255,255, 0.70)` | Page window |
| `--glass-t1-bg` | `rgba(255,255,255, 0.50)` | Section cards |
| `--glass-t2-bg` | `rgba(255,255,255, 0.35)` | Nested elements |
| `--glass-t3-bg` | `rgba(255,255,255, 0.60)` | Over media |
| `--text-primary` | `rgba(0,0,0, 0.95)` | Titles, values |
| `--text-secondary` | `rgba(0,0,0, 0.70)` | Body, labels |
| `--text-tertiary` | `rgba(0,0,0, 0.50)` | Captions, hints |
| `--color-safe` | `#34d399` | Green — normal |
| `--color-warning` | `#fbbf24` | Amber — MEDIUM |
| `--color-danger` | `#f87171` | Red — HIGH |
| `--color-info` | `#60a5fa` | Blue — info |

### 3.2 Typography
📄 Full scale: **L455–502**

- **Fonts**: `-apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', system-ui`
- **Display**: `clamp(3.5rem, ..., 6rem)` weight 800
- **Title 1**: `clamp(2rem, ..., 3rem)` weight 700
- **Body**: `clamp(1rem, ..., 1.125rem)` weight 500
- **Weights**: Body=500, Headline=600, Title=700, Display=800
- **Tracking**: Display=-0.02em, Body=-0.01em, Captions=+0.04em

### 3.3 Spacing (4px grid)
📄 **L505–527**

`--space-1` (4px) → `--space-24` (96px) · Content max: 1400px · Navbar: 64px · Sidebar: 280px

### 3.4 Shadows (6 levels)
📄 **L530–581**

| Level | Usage | Key Values |
|-------|-------|-----------|
| 0 | Page window | `0 32px 80px rgba(0,0,0,0.10)` + inset glow |
| 1 | Table rows | `none` |
| 2 | Cards, inputs | `0 2px 8px` |
| 3 | Hovered cards | `0 6px 20px` + inset glow |
| 4 | Navbar, sidebar | `0 10px 40px` |
| 5 | Modals | `0 20px 60px` |

### 3.5 Border Radius
📄 **L583–599**

`--radius-xs` 6px → `--radius-3xl` 36px → `--radius-full` 9999px

### 3.6 Easing & Timing
📄 **L601–619**

- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Durations**: instant 100ms · fast 200ms · normal 350ms · slow 500ms · dramatic 800ms

---

## 4. Architecture & Setup
📄 **L4577–4623** (Phase 0) + **L4735–4800** (Build config)

### Quick Start
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npm install react-router-dom socket.io-client leaflet react-leaflet framer-motion lucide-react lenis zustand
npm install -D @types/leaflet
```

### Project Structure
```
frontend/
├── src/
│   ├── components/    # StatCard, LiveMap, AlertFeed, etc.
│   ├── pages/         # Dashboard, Events, Landing, Login
│   ├── hooks/         # useWebSocket, useAudioAlert
│   ├── utils/         # pageTransitions, motion variants
│   ├── types/         # TypeScript interfaces
│   ├── styles/        # globals.css (design tokens + atmosphere + glass)
│   └── App.tsx        # Root with atmosphere + AnimatePresence routes
├── public/sounds/     # Alert audio files
└── vite.config.ts     # Dev proxy to Flask :5000
```

📄 Vite config with proxy: **L4740–4781**  
📄 Dev workflow: **L4783–4800**

---

## 5. Core Components
📄 **L623–1010**

### 5.0 Page Window (Tier 0) ⭐ MOST IMPORTANT
📄 **L625–776** (spec + full CSS)

```tsx
<div className="page-window">
  <div className="window-grain" />
  <div className="page-content">
    {/* All page content here */}
  </div>
</div>
```

Key CSS: `background: var(--glass-t0-bg)` · `backdrop-filter: var(--glass-t0-blur)` · `margin: 40px` · `padding: 64px` · `border-radius: 36px` · `min-height: calc(100vh - 80px)`

> ⚠️ Every main page MUST use `.page-window`. Navbar stays outside (fixed).

### 5.1 Glass Card (Tier 1)
📄 **L780–807**

`.glass-card` — `var(--glass-t1-bg)` · blur 20px · hover: translateY(-4px) + shadow-3

### 5.2 Floating Button
📄 **L808–857**

Pill shape · shimmer animation on hover · glass-t1 background

### 5.3 Metric Card
📄 **L859–910**

Gradient text value · hover: translateY(-8px) rotateX(5deg) · specular highlight `::before`

### 5.4 Navigation Bar
📄 **L912–933**

Fixed top · blur 24px · scrolled state: stronger bg + shadow

### 5.5 Modal
📄 **L935–981**

Overlay: `rgba(0,0,0,0.4)` + blur 8px · modalSlideUp animation · max-width 600px

### 5.6 Input Field
📄 **L983–1009**

Tier 2 glass · focus: border glow + ring `0 0 0 4px rgba(255,255,255,0.1)`

---

## 6. Page Implementations

### 6.1 Global Background (Atmosphere)
📄 **L1359–1519** (full CSS with all 4 orbs + noise)

Applied once at root → `.atmosphere` with 4 `.orb` divs + `.noise-overlay`.  
Orbs: 50–70vw, blur 120px, 22–32s float cycle. GPU accelerated.

📄 App.tsx root structure: **L1017–1048**

### 6.2 Page Transitions (Framer Motion)
📄 **L1522–1721**

3 transition variants: `slideTransition`, `scaleTransition`, `fadeSlideTransition`  
Spring config: stiffness 300, damping 30, mass 0.8

```tsx
// Wrap routes in AnimatePresence
<AnimatePresence mode="wait">
  <Routes location={location} key={location.pathname}>
    <Route path="/" element={<AnimatedPage transition="fade-slide"><Landing /></AnimatedPage>} />
    <Route path="/dashboard" element={<AnimatedPage transition="slide"><Dashboard /></AnimatedPage>} />
  </Routes>
</AnimatePresence>
```

📄 AnimatedPage component: **L1636–1670**  
📄 Updated App.tsx with AnimatePresence: **L1672–1721**

### 6.3 Landing Page
📄 **L1820–1884**

**Exception**: No `.page-window` — full-screen immersive hero only.  
Mouse parallax (15px max) · Lenis smooth scroll · Staggered entrance · Dual CTAs

📄 Animation choreography table: **L1862–1874**

### 6.4 Login Page
📄 **L1885–1936**

Centered Tier 1 glass card (max-width 420px) · gradient CTA button · stagger entrance 80ms · success sequence (check → scale → fade → navigate)

### 6.5 Dashboard Page ⭐
📄 **L1938–2830** (design) + **L2021–2712** (complete TSX)

5 sections: Stats Grid · Live Map · Alert Feed · Quick Actions · System Health

📄 Design principles breakdown: **L1955–2018**  
📄 Complete Dashboard.tsx: **L2025–2625**  
📄 DashboardSkeleton: **L2631–2711**  
📄 Visual layout ASCII: **L2714–2791**

### 6.6 Events Page
📄 **L4332–4478**

`.page-window` wrapper · Header + filters toolbar · Events table (Tier 1 glass) · Pagination (glass pills)  
Row hover: `translateX(4px)` + subtle glow · Click → Evidence Modal

📄 Evidence Modal layout: **L4418–4448**  
📄 Severity badge CSS: **L4450–4478**

---

## 7. Features & Integrations

### 7.1 WebSocket (Socket.IO)
📄 **L3978–4061** (useWebSocket hook) + **L4709–4733** (basic usage)

```tsx
const { isConnected, connectionQuality, subscribe, emit } = useWebSocket(API_BASE_URL)
subscribe('new_event', handleNewEvent)
subscribe('location_update', handleLocationUpdate)
```

Connection qualities: `excellent` | `good` | `poor` | `disconnected`

### 7.2 Map (Leaflet)
📄 **L3108–3392** (LiveMap component) + **L4804–4960** (alt react-leaflet version)

- CARTO Positron basemap (light mode)
- Custom glass markers: 32px circle, colored border by status
- Glass popups, fullscreen toggle, layer switch
- Default center: Trivandrum `[8.5241, 76.9366]`

### 7.3 Audio Alerts
📄 **L4064–4092** (useAudioAlert hook)

```tsx
const { playAlert } = useAudioAlert()
if (event.severity === 'HIGH') playAlert('high')
```

Files: `/sounds/alert-high.mp3`, `/sounds/alert-medium.mp3`, `/sounds/alert-low.mp3`

### 7.4 API Endpoints
📄 **L4648–4707**

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/events` | `Event[]` |
| GET | `/api/buses/locations` | `BusLocation[]` |
| GET | `/api/stats` | `{ total_events_today, active_buses, high_severity_count }` |
| GET | `/api/export/events?start_date=&end_date=` | CSV download |
| POST | `/api/events` | Create event (bus units, needs API key) |
| POST | `/api/buses/{id}/location` | Update bus position |

### 7.5 TypeScript Types
📄 **L4096–4133**

```tsx
interface DashboardStats { activeBuses: number; eventsToday: number; highSeverity: number; systemUptime: string }
interface BusLocation { bus_id: string; latitude: number; longitude: number; speed: number; heading: number; timestamp: string; driver_name?: string; status: 'active'|'idle'|'offline' }
interface Event { id: number; bus_id: string; event_type: string; severity: 'HIGH'|'MEDIUM'|'LOW'; timestamp: string; speed?: number; latitude: number; longitude: number; snapshot_path?: string; video_path?: string }
```

---

## 8. Key Components Reference

### StatCard
📄 **L2832–3104**

Props: `icon, label, value, change?, trend?, color?, subtitle?, delay?, pulse?`  
Features: Counter-up animation (1.5s) · shimmer on hover · gradient accent · pulsing icon · hover glow border

### AlertFeed
📄 **L3396–3642**

Props: `events, maxItems?, onEventClick?`  
Features: AnimatePresence popLayout · severity-colored left border · HIGH pulsing glow · empty state "All Clear"

### QuickActions
📄 **L3648–3779**

Refresh button (spinning icon + shimmer) · Export button (bouncing icon)

### SystemHealth
📄 **L3782–3974**

Connection quality badge (pulsing WiFi icon) · active bus count · color-coded status

---

## 9. Styling & Animations
📄 **L4137–4328** (Dashboard CSS) + **L4482–4573** (Animation Library)

### Dashboard CSS
📄 **L4139–4328** — Includes: header, section-header, window-glow, live-indicator, map-popup, skeleton shimmer, stat-card hover, responsive breakpoints

### Motion Variants (Framer Motion)
📄 **L4486–4528**

- `fadeInUp` — opacity 0→1, y 40→0
- `scaleIn` — opacity 0→1, scale 0.9→1
- `staggerContainer` — children 0.1s apart
- `floatAnimation` — y [0, -10, 0] infinite
- `tiltOnHover` — rotateX/Y 5deg

### CSS Keyframes
📄 **L4530–4573**

- `gradientShift` — background-position shift (15s)
- `pulseGlow` — box-shadow pulse
- `slideInFromTop` — translateY(-20px) → 0

### Responsive Breakpoints  
📄 **L4304–4327**

- Mobile ≤768px: single column, stack headers
- Stats grid: `1fr` on mobile
- Map: height 360px on mobile

---

## 10. Quality & Appendices

### Quality Checklist
📄 **L4964–4995**

- Visual: WCAG AA contrast, consistent radius, 4px grid
- Performance: FCP <1.2s, LCP <2.5s, TTI <3.5s, CLS <0.1, 60fps
- Accessibility: 44px touch targets, keyboard nav, `prefers-reduced-motion`
- Responsive: 320px → 2560px+

### Dependencies
📄 **L5014–5050**

Key: react 19 · framer-motion 12 · socket.io-client 4 · leaflet 1.9 · lucide-react · lenis · zustand · recharts · howler

### Backend Integration
📄 **L4626–4800**

Flask serves `frontend/dist/` · Dev: Vite on :5173 proxies `/api` and `/socket.io` to Flask :5000 · Prod: `npm run build` then `python app.py`

### References
📄 **L4998–5010**

Apple visionOS HIG · Linear.app · Awwwards glassmorphism · Dribbble spatial UI

---

> **This is the cheat sheet. For full code blocks, detailed explanations, and ASCII diagrams, refer to the line numbers in `frontend_implementation_guide.md`.**
