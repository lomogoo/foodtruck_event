import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './ui'

/**
 * 下から出るシート。下方向スワイプで閉じられるので、
 * 「戻る」を探さずに親指だけで離脱できる。
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'full'
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose()
            }}
            className={cx(
              'relative flex w-full flex-col overflow-hidden bg-surface',
              'rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]',
              'shadow-[var(--shadow-float)] sm:max-w-[560px] sm:mx-4',
              size === 'full' ? 'h-[92dvh] sm:h-[88dvh]' : 'max-h-[88dvh]',
            )}
          >
            <div className="shrink-0 cursor-grab active:cursor-grabbing pt-2.5 pb-1">
              <div className="mx-auto h-[5px] w-9 rounded-full bg-[var(--c-line-strong)]" />
            </div>
            {title && (
              <div className="shrink-0 flex items-center justify-between gap-3 px-5 pb-3 pt-1">
                <div className="min-w-0 text-[17px] font-semibold tracking-tight truncate">{title}</div>
                <button
                  onClick={onClose}
                  aria-label="閉じる"
                  className="shrink-0 grid h-8 w-8 place-items-center rounded-full bg-[var(--c-surface-2)] text-muted transition-colors hover:text-ink"
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-line bg-surface px-5 py-3.5 pad-safe-b">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
