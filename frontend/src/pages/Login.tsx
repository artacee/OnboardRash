// ============================================================
// Login Page — Awwwards-worthy Cinematic Authentication
// ============================================================

import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, Shield, Lock, User, Fingerprint } from 'lucide-react'
import { ParticleField } from '@/components/three/ParticleField'
import { Button } from '@/components/ui/Button'

export function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<'username' | 'password' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse glow effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulated auth with dramatic delay
    await new Promise((r) => setTimeout(r, 1200))
    if (username === 'admin' && password === 'admin') {
      sessionStorage.setItem('logged_in', 'true')
      sessionStorage.setItem('username', username)
      navigate('/dashboard')
    } else {
      setError('Access denied. Credentials invalid.')
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      {/* Particle Background */}
      <div className="absolute inset-0 opacity-50">
        <ParticleField className="absolute inset-0" count={400} color="#DC2626" />
      </div>

      {/* Animated grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Multiple radial gradients for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(20,184,166,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-void)_70%)] pointer-events-none" />

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex items-center gap-3 px-5 py-2 rounded-full glass text-xs font-mono tracking-wider uppercase text-kerala-teal border border-kerala-teal/20">
          <Lock className="w-3 h-3" />
          Secure Authentication Portal
        </div>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-6"
      >
        {/* Card glow effect behind */}
        <div className="absolute -inset-1 bg-gradient-to-r from-ksrtc-crimson/20 via-transparent to-kerala-teal/20 rounded-3xl blur-xl opacity-60" />
        
        <div 
          ref={containerRef}
          className="relative glass-strong rounded-3xl p-10 shadow-2xl overflow-hidden"
        >
          {/* Mouse follow glow */}
          <div 
            className="absolute w-96 h-96 rounded-full bg-kerala-teal/5 blur-3xl pointer-events-none transition-all duration-300"
            style={{
              left: mousePos.x - 192,
              top: mousePos.y - 192,
            }}
          />

          {/* HUD corner decorations */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-kerala-teal/30 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-kerala-teal/30 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-ksrtc-crimson/30 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-ksrtc-crimson/30 rounded-br-2xl" />

          {/* Header */}
          <div className="relative text-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-ksrtc-crimson via-ksrtc-glow to-ksrtc-crimson bg-[length:200%_200%] animate-gradient-slow flex items-center justify-center mx-auto mb-6"
            >
              <Zap className="w-10 h-10 text-white" />
              {/* Animated rings */}
              <span className="absolute inset-0 rounded-2xl animate-ping-slow bg-ksrtc-crimson/30" />
              <div className="absolute -inset-3 border border-ksrtc-crimson/20 rounded-3xl animate-pulse" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display font-bold text-3xl gradient-text-crimson mb-2"
            >
              KSRTC Command
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-text-ghost text-sm font-mono tracking-wider"
            >
              [ AUTHORIZED ACCESS ONLY ]
            </motion.p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 px-4 py-3 rounded-xl bg-signal-critical/10 border border-signal-critical/30 text-signal-critical text-sm flex items-center gap-3 overflow-hidden"
              >
                <Shield className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative space-y-6">
            {/* Username */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center gap-2 text-text-secondary text-sm font-medium mb-3">
                <User className="w-4 h-4" />
                Operator ID
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  placeholder={focused === 'username' ? '' : 'Enter credentials...'}
                  className="w-full px-5 py-4 bg-surface-1/50 border border-border-subtle rounded-xl text-text-primary placeholder:text-text-ghost focus:outline-none focus:border-kerala-teal/50 focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1),inset_0_0_20px_rgba(20,184,166,0.05)] transition-all duration-300"
                  required
                />
                {/* Focus glow line */}
                <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-kerala-teal to-transparent transition-opacity duration-300 ${focused === 'username' ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="flex items-center gap-2 text-text-secondary text-sm font-medium mb-3">
                <Lock className="w-4 h-4" />
                Access Code
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder={focused === 'password' ? '' : '••••••••'}
                  className="w-full px-5 py-4 bg-surface-1/50 border border-border-subtle rounded-xl text-text-primary placeholder:text-text-ghost focus:outline-none focus:border-kerala-teal/50 focus:shadow-[0_0_0_4px_rgba(20,184,166,0.1),inset_0_0_20px_rgba(20,184,166,0.05)] transition-all duration-300 pr-14"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-ghost hover:text-kerala-teal transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
                {/* Focus glow line */}
                <div className={`absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-kerala-teal to-transparent transition-opacity duration-300 ${focused === 'password' ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="submit"
                size="lg"
                className="w-full py-4 text-base relative overflow-hidden group"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    <span>Initialize Session</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-10 pt-6 border-t border-border-subtle"
          >
            <div className="flex items-center justify-center gap-6 text-text-ghost text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-signal-safe animate-pulse" />
                <span>TLS 1.3</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3" />
                <span>AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span>2FA Ready</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-ghost text-xs font-mono tracking-wider"
      >
        KSRTC Fleet Command System v2.0 • Kerala State Road Transport Corporation
      </motion.div>
    </div>
  )
}
