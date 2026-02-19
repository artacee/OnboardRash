/**
 * useAudioAlert — Plays audio beep for HIGH severity events
 * 
 * Uses the Web Audio API to generate tones programmatically.
 * No external audio files required.
 */

import { useRef, useCallback } from 'react'

const FREQUENCIES = {
    high: 880,    // A5 — urgent, attention-grabbing
    medium: 660,  // E5 — moderate alert
    low: 440      // A4 — gentle notification
}

const DURATIONS = {
    high: 300,
    medium: 200,
    low: 150
}

export function useAudioAlert() {
    const audioContextRef = useRef<AudioContext | null>(null)

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)() // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return audioContextRef.current
    }, [])

    const playAlert = useCallback((severity: 'high' | 'medium' | 'low' = 'high') => {
        try {
            const ctx = getAudioContext()
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.frequency.value = FREQUENCIES[severity]
            oscillator.type = 'sine'

            // Fade in/out for a clean beep
            const now = ctx.currentTime
            const duration = DURATIONS[severity] / 1000
            gainNode.gain.setValueAtTime(0, now)
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02)
            gainNode.gain.linearRampToValueAtTime(0, now + duration)

            oscillator.start(now)
            oscillator.stop(now + duration)

            // Double beep for high severity
            if (severity === 'high') {
                const osc2 = ctx.createOscillator()
                const gain2 = ctx.createGain()
                osc2.connect(gain2)
                gain2.connect(ctx.destination)
                osc2.frequency.value = FREQUENCIES.high
                osc2.type = 'sine'

                const delay = duration + 0.1
                gain2.gain.setValueAtTime(0, now + delay)
                gain2.gain.linearRampToValueAtTime(0.3, now + delay + 0.02)
                gain2.gain.linearRampToValueAtTime(0, now + delay + duration)

                osc2.start(now + delay)
                osc2.stop(now + delay + duration)
            }
        } catch (err) {
            console.error('Failed to play alert sound:', err)
        }
    }, [getAudioContext])

    return { playAlert }
}
