/**
 * Login Page
 * 
 * Full-screen login with centered glass card form.
 * Features: email/password inputs, gradient submit button,
 * success animation sequence → navigates to /dashboard.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, CheckCircle, Loader2, Bus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import api from '@/services/api'

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!username || !password) {
            setError('Please fill in all fields')
            return
        }

        setIsLoading(true)

        try {
            const result = await api.auth.login(username, password)
            setIsLoading(false)
            setIsSuccess(true)
            login(result.user.username, result.user.role)

            // Success sequence → navigate
            setTimeout(() => {
                navigate('/dashboard')
            }, 1500)
        } catch (err) {
            setIsLoading(false)
            setError(err instanceof Error ? err.message : 'Invalid username or password')
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            position: 'relative'
        }}>
            <AnimatePresence mode="wait">
                {!isSuccess ? (
                    <motion.div
                        key="login-form"
                        className="glass-card"
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        style={{
                            width: '100%',
                            maxWidth: '440px',
                            padding: 'var(--space-12) var(--space-10)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Subtle top gradient accent */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
                            backgroundSize: '200% 100%',
                            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0'
                        }} />

                        {/* Logo / App Icon */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
                        >
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: 'rgba(155, 114, 255, 0.75)',
                                borderRadius: 'var(--radius-2xl)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-5)',
                                boxShadow: '0 12px 32px rgba(120, 80, 220, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <Bus className="w-9 h-9" style={{ color: '#fff', strokeWidth: 2 }} />
                            </div>
                            <h2 style={{
                                fontSize: 'var(--text-title-1)',
                                fontWeight: 'var(--weight-title)',
                                color: 'var(--text-primary)',
                                marginBottom: 'var(--space-2)',
                                letterSpacing: '-0.02em',
                                textAlign: 'center'
                            }}>
                                Welcome Back
                            </h2>
                            <p style={{
                                fontSize: 'var(--text-body)',
                                color: 'var(--text-tertiary)',
                                textAlign: 'center'
                            }}>
                                Sign in to your Account
                            </p>
                        </motion.div>

                        <form onSubmit={handleSubmit}>
                            {/* Username Input */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.4 }}
                                style={{ marginBottom: 'var(--space-5)' }}
                            >
                                <label style={{
                                    display: 'block',
                                    fontSize: 'var(--text-footnote)',
                                    fontWeight: 'var(--weight-headline)',
                                    color: 'var(--text-secondary)',
                                    marginBottom: 'var(--space-2)',
                                    letterSpacing: '0.01em'
                                }}>
                                    Username
                                </label>
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <User size={18} style={{
                                        position: 'absolute',
                                        left: '16px',
                                        color: 'var(--text-tertiary)',
                                        pointerEvents: 'none'
                                    }} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="input-glass"
                                        style={{
                                            width: '100%',
                                            paddingLeft: '48px',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                            </motion.div>

                            {/* Password Input */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                style={{ marginBottom: 'var(--space-7)' }}
                            >
                                <label style={{
                                    display: 'block',
                                    fontSize: 'var(--text-footnote)',
                                    fontWeight: 'var(--weight-headline)',
                                    color: 'var(--text-secondary)',
                                    marginBottom: 'var(--space-2)',
                                    letterSpacing: '0.01em'
                                }}>
                                    Password
                                </label>
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <Lock size={18} style={{
                                        position: 'absolute',
                                        left: '16px',
                                        color: 'var(--text-tertiary)',
                                        pointerEvents: 'none'
                                    }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="input-glass"
                                        style={{
                                            width: '100%',
                                            paddingLeft: '48px',
                                            paddingRight: '48px',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-tertiary)',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                        style={{
                                            color: 'var(--color-danger)',
                                            fontSize: 'var(--text-footnote)',
                                            marginBottom: 'var(--space-4)',
                                            padding: 'var(--space-3) var(--space-4)',
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                        }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Sign In Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                style={{ width: '100%', marginTop: 'var(--space-6)' }}
                            >
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    size="lg"
                                    disabled={isLoading}
                                    leftIcon={isLoading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            style={{ display: 'flex' }}
                                        >
                                            <Loader2 size={20} />
                                        </motion.div>
                                    ) : undefined}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(102, 126, 234, 0.12)',
                                        color: '#667eea',
                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                        fontWeight: 'var(--weight-headline)',
                                        textAlign: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </motion.div>
                        </form>
                    </motion.div>
                ) : (
                    /* Success Animation */
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        style={{ textAlign: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                            style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #34d399, #10b981)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-6)',
                                boxShadow: '0 12px 32px rgba(52, 211, 153, 0.4)'
                            }}
                        >
                            <CheckCircle size={40} color="#fff" />
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                fontSize: 'var(--text-title-2)',
                                fontWeight: 'var(--weight-title)',
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.02em'
                            }}
                        >
                            Welcome back!
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
