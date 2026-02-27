/**
 * AI Insights Page — Powered by Gemini
 * 
 * Vision OS floating glass effect layer for Fleet Intelligence.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Activity, AlertTriangle, CheckCircle, BrainCircuit, RefreshCw, AlertCircle } from 'lucide-react'
import api from '@/services/api'
import type { AIInsightsData } from '@/types'
import './Insights.css'

export default function Insights() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<AIInsightsData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isMock, setIsMock] = useState(false)

    const fetchInsights = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await api.analytics.getAIInsights()
            if (res.status === 'success' && res.data) {
                setData(res.data)
                setIsMock(!!res.is_mock)
            } else {
                throw new Error(res.error || 'Failed to fetch insights')
            }
        } catch (err: any) {
            console.error('Insights fetch error:', err)
            setError(err.message || 'An unexpected error occurred while generating insights.')
        } finally {
            setLoading(false)
        }
    }

    // Helper to parse markdown-like bolding from Gemini response
    const renderFormattedText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>
            }
            return <span key={index}>{part}</span>
        })
    }

    return (
        <div className="page-window insights-window">
            <div className="insights-header">
                <div>
                    <h1>Fleet Intelligence</h1>
                    <p>AI-powered deep dive into safety patterns & analytics</p>
                </div>

                <button
                    className="generate-btn"
                    onClick={fetchInsights}
                    disabled={loading}
                >
                    {loading ? (
                        <RefreshCw className="icon animate-spin" size={20} />
                    ) : (
                        <Sparkles className="icon sparkle-icon" size={20} />
                    )}
                    <span>{data ? 'Regenerate Insights' : 'Generate Report'}</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="insights-error"
                    >
                        <AlertCircle size={24} />
                        <p>{error}</p>
                        <button className="retry-btn" onClick={fetchInsights}>Retry</button>
                    </motion.div>
                )}

                {isMock && !loading && data && (
                    <motion.div
                        key="mock-banner"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mock-banner"
                    >
                        <AlertTriangle size={20} />
                        <p>Using demo data. Add a Gemini API Key to `.env` for dynamic insights.</p>
                    </motion.div>
                )}

                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="insights-loading"
                    >
                        <div className="loader-orb" />
                        <span className="loading-text">Analyzing Telemetry...</span>
                    </motion.div>
                ) : !data && !loading && !error ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="insights-empty"
                    >
                        <BrainCircuit size={64} className="empty-icon" />
                        <h3>Ask Gemini</h3>
                        <p>Generate a comprehensive, AI-written report on your fleet's safety performance over the past 24 hours.</p>
                    </motion.div>
                ) : data ? (
                    <motion.div
                        key="results"
                        className="insights-results"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.15 } }
                        }}
                    >
                        {/* Summary Card */}
                        <motion.div
                            className="insight-card summary"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                        >
                            <div className="card-header">
                                <div className="icon">
                                    <Activity size={24} />
                                </div>
                                <h2>Executive Summary</h2>
                            </div>
                            <div className="summary-content">
                                {renderFormattedText(data.overall_summary)}
                            </div>
                        </motion.div>

                        {/* Findings Card */}
                        <motion.div
                            className="insight-card findings"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                        >
                            <div className="card-header">
                                <div className="icon">
                                    <AlertTriangle size={24} />
                                </div>
                                <h2>Key Risk Factors</h2>
                            </div>
                            <ul className="findings-list">
                                {data.key_findings.map((finding, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (idx * 0.1) }}
                                    >
                                        {renderFormattedText(finding)}
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Recommendations Card */}
                        <motion.div
                            className="insight-card recommendations"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                        >
                            <div className="card-header">
                                <div className="icon">
                                    <CheckCircle size={24} />
                                </div>
                                <h2>Recommended Actions</h2>
                            </div>
                            <ul className="recommendations-list">
                                {data.recommendations.map((rec, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + (idx * 0.1) }}
                                    >
                                        {renderFormattedText(rec)}
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}
