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
import { useEffect } from 'react'
import Lenis from 'lenis'
import { HelmetProvider } from 'react-helmet-async'
import AnimatedPage from '@/components/AnimatedPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { Landing, Login, Dashboard, Events, Settings } from '@/pages'
import { Background } from '@/components/layout/Background'
import { Navbar } from '@/components/layout'
import './index.css'

function AnimatedRoutes() {
  const location = useLocation()

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like easing
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {location.pathname !== '/' && location.pathname !== '/login' && (
          <Navbar key={location.pathname} />
        )}
      </AnimatePresence>
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
          <Route path="/settings" element={
            <ProtectedRoute>
              <AnimatedPage transition="slide">
                <Settings />
              </AnimatedPage>
            </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="app-root">
            <Background />

            {/* ═══════════════════════════════════════════════════════════════════════
            PAGE ROUTES
            Each page floats on top of the atmosphere background.
            AnimatePresence enables Vision OS exit/enter transitions.
            ═══════════════════════════════════════════════════════════════════════ */}
            <AnimatedRoutes />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
