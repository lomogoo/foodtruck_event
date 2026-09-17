import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AlertIcon, CheckIcon } from './icons'

type ToastTone = 'default' | 'ok' | 'error'
interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const Ctx = createContext<(message: string, tone?: ToastTone) => void>(() => {})

export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((message: string, tone: ToastTone = 'default') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="pointer-events-auto flex max-w-[min(92vw,420px)] items-center gap-2 rounded-full bg-[var(--c-ink)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--c-surface)] shadow-[var(--shadow-float)]"
            >
              {t.tone === 'ok' && <CheckIcon size={16} className="shrink-0" />}
              {t.tone === 'error' && <AlertIcon size={16} className="shrink-0" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
