/**
 * Landing Page — Simplified Hero Only
 * Features: Hero section with parallax effects and floating decorations
 */

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Cpu, Camera, MapPin } from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { Button } from '@/components/ui';
import { useLenis, useMouseParallax } from '@/hooks';

// Technology stack
const techStack = [
  { icon: <Cpu className="w-5 h-5" />, label: 'Raspberry Pi', desc: 'Edge Computing' },
  { icon: <Camera className="w-5 h-5" />, label: 'Computer Vision', desc: 'AI Detection' },
  { icon: <MapPin className="w-5 h-5" />, label: 'GPS Tracking', desc: 'Real-time Location' },
];

// Animation variants
const heroStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const overlineItem = {
  hidden: { opacity: 0, y: 20, letterSpacing: '0.1em' },
  visible: {
    opacity: 1,
    y: 0,
    letterSpacing: '0.2em',
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function Landing() {
  // Initialize Lenis smooth scroll
  useLenis({ lerp: 0.08, duration: 1.4 });

  // Mouse parallax for floating elements
  const mouseParallax = useMouseParallax(15);

  // Refs for sections
  const heroRef = useRef<HTMLDivElement>(null);

  // Scroll-based parallax for hero
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useSpring(useTransform(heroScrollProgress, [0, 1], [0, 150]), { stiffness: 100, damping: 30 });
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScrollProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Navbar transparent />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION — 100vh with parallax
          ═══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* Floating parallax decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating card 1 */}
          <motion.div
            className="absolute top-[20%] left-[5%] w-48 h-32 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hidden lg:block"
            style={{
              x: mouseParallax.x * 1.5,
              y: mouseParallax.y * 1.5,
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 0.6, x: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          />
          
          {/* Floating card 2 */}
          <motion.div
            className="absolute top-[30%] right-[8%] w-40 h-56 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hidden lg:block"
            style={{
              x: mouseParallax.x * -1.2,
              y: mouseParallax.y * -1.2,
            }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 0.5, x: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
          />
          
          {/* Floating card 3 */}
          <motion.div
            className="absolute bottom-[25%] left-[10%] w-36 h-44 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hidden lg:block"
            style={{
              x: mouseParallax.x * 0.8,
              y: mouseParallax.y * 0.8,
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 0.4, y: 0 }}
            transition={{ duration: 1, delay: 1.6 }}
          />
        </div>

        {/* Hero content with parallax */}
        <motion.div
          className="relative z-10 text-center max-w-5xl mx-auto"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <motion.div variants={heroStagger} initial="hidden" animate="visible">
            {/* Overline */}
            <motion.p
              className="text-sm font-semibold tracking-[0.2em] text-white/50 uppercase mb-6"
              variants={overlineItem}
            >
              Real-Time Fleet Intelligence
            </motion.p>

            {/* Display Title */}
            <motion.h1
              className="text-[clamp(3rem,4vw+2rem,7rem)] font-extrabold leading-[0.95] tracking-tight"
              variants={heroItem}
            >
              <span className="block bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
                Detect. Protect.
              </span>
              <motion.span 
                className="block bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent"
                variants={heroItem}
              >
                Drive Safer.
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mt-8 text-lg md:text-xl text-white/70 max-w-xl mx-auto font-medium leading-relaxed"
              variants={heroItem}
            >
              AI-powered rash driving detection for fleet management. 
              Protect your drivers and passengers with real-time alerts.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={heroItem}
            >
              <Link to="/dashboard">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                    Launch Dashboard
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Tech Stack Pills */}
            <motion.div 
              className="mt-16 flex flex-wrap items-center justify-center gap-4"
              variants={heroItem}
            >
              {techStack.map((tech) => (
                <motion.div 
                  key={tech.label}
                  className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-[#667eea]">{tech.icon}</span>
                  <div className="text-left">
                    <span className="text-sm font-medium text-white/80 block leading-tight">{tech.label}</span>
                    <span className="text-xs text-white/40">{tech.desc}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

      </section>

      <Footer />
    </div>
  );
}
