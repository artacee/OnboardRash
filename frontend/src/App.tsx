/**
 * App.tsx — Root Application Component
 * 
 * Sets up:
 * - React Router for navigation
 * - AnimatePresence for Vision OS page transitions
 * - Animated atmosphere background (Vision OS style)
 * - Page routes
 * 
 * Per frontend_implementation_guide.md:
 * - 4 animated gradient orbs on fixed background
 * - Noise texture overlay
 * - Pages float on top of atmosphere
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AnimatedPage from '@/components/AnimatedPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { Landing, Login, Dashboard, Events } from '@/pages'
import './index.css'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <AnimatedPage transition="fade-slide">
            <Landing />
          </AnimatedPage>
        } />
        <Route path="/login" element={
          <AnimatedPage transition="scale">
            <Login />
          </AnimatedPage>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AnimatedPage transition="slide">
              <Dashboard />
            </AnimatedPage>
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute>
            <AnimatedPage transition="slide">
              <Events />
            </AnimatedPage>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <div className="app-root">
        {/* ═══════════════════════════════════════════════════════════════════════
            SVG LENSING FILTER — Apple-style glass refraction
            Subtle displacement creates a "bend" in background behind glass.
            Referenced via backdrop-filter: url(#glass-lens) in CSS.
            ═══════════════════════════════════════════════════════════════════════ */}
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glass-lens" x="-10%" y="-10%" width="120%" height="120%">
              {/* Fractal noise generates organic displacement texture */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015 0.015"
                numOctaves="3"
                seed="5"
                result="noise"
              />
              {/* Displace source pixels using the noise — scale=3 is very subtle */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="3"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* ═══════════════════════════════════════════════════════════════════════
            ANIMATED ATMOSPHERE BACKGROUND
            Fixed position, behind all content. 4 gradient orbs + noise.
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="atmosphere">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="orb orb-4" />
          <div className="noise-overlay" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PAGE ROUTES
            Each page floats on top of the atmosphere background.
            AnimatePresence enables Vision OS exit/enter transitions.
            ═══════════════════════════════════════════════════════════════════════ */}
        <AnimatedRoutes />
      </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
