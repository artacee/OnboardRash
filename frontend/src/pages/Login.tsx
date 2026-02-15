// ============================================================
// Login Page — Cinematic glassmorphism authentication
// ============================================================

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'
import { ParticleField } from '@/components/three/ParticleField'
import { Button } from '@/components/ui/Button'

export function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simple auth (matches existing sessionStorage pattern)
    await new Promise((r) => setTimeout(r, 800)) // Simulate network
    if (username === 'admin' && password === 'admin') {
      sessionStorage.setItem('logged_in', 'true')
      sessionStorage.setItem('username', username)
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Try admin / admin')
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      {/* Particle Background */}
      <div className="absolute inset-0 opacity-40">
        <ParticleField className="absolute inset-0" count={300} color="#DC2626" />
      </div>

      {/* Radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-void)_70%)] pointer-events-none" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-6"
      >
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ksrtc-crimson to-ksrtc-glow flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.div>

            <h1 className="font-display font-bold text-2xl gradient-text-crimson mb-1">
              KSRTC Command Center
            </h1>
            <p className="text-text-ghost text-sm">Authorized personnel only</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-3 rounded-lg bg-signal-critical/10 border border-signal-critical/20 text-signal-critical text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-text-primary text-sm placeholder:text-text-ghost focus:outline-none focus:border-ksrtc-crimson/50 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-text-primary text-sm placeholder:text-text-ghost focus:outline-none focus:border-ksrtc-crimson/50 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-ghost hover:text-text-secondary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-center gap-2 text-text-ghost text-xs">
            <Shield className="w-3 h-3" />
            <span>Encrypted session • Auto-logout after 30min</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
