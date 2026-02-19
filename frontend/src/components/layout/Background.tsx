

export function Background() {
    return (
        <>
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
        </>
    )
}
