import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showCloseButton?: boolean
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  maxWidth = 'md',
  className
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  const maxWidthClasses = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1000px',
    full: '95vw'
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Overlay */}
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeOnOutsideClick ? onClose : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 'var(--space-4)'
            }}
          >
            {/* Modal Content */}
            <motion.div
              className={cn('modal-content glass-card', className)}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: maxWidthClasses[maxWidth],
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative',
                background: 'var(--glass-primary)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-glass)',
                padding: 'var(--space-8)'
              }}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: title ? 'var(--space-6)' : 0,
                    paddingBottom: title ? 'var(--space-4)' : 0,
                    borderBottom: title ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'
                  }}
                >
                  {title && (
                    <h2
                      style={{
                        fontSize: 'var(--text-title-2)',
                        fontWeight: 'var(--weight-title)',
                        color: 'var(--text-primary)',
                        margin: 0,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {title}
                    </h2>
                  )}

                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      style={{
                        background: 'rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: 'var(--radius-full)',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        marginLeft: title ? 'var(--space-4)' : 0,
                        transition: 'all var(--duration-fast) var(--ease-default)'
                      }}
                      aria-label="Close modal"
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Body */}
              <div>{children}</div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Render modal in portal (outside root element)
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}
