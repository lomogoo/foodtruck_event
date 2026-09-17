import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { EventCard } from '../../components/EventCard'
import { EventDetail } from '../../components/EventDetail'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { ChevronLeftIcon, SparkleIcon } from '../../components/icons'
import { Button, EmptyState, Spinner } from '../../components/ui'
import { loadHandled, markHandled, unmarkHandled } from '../../lib/profile'
import { useStore } from '../../lib/store'
import type { EventRecord } from '../../lib/types'
import { ApplyForm } from './ApplyForm'

const SWIPE_DISTANCE = 110
const SWIPE_VELOCITY = 520

/**
 * 出店者の入口。1画面＝1イベントに絞り、判断を「右か左か」まで単純化する。
 * 選択肢が並ぶほど人は決められなくなる（選択のパラドックス）ので、あえて積む。
 */
export function Discover() {
  const { events, loading, statsFor } = useStore()
  const toast = useToast()

  const [handled, setHandled] = useState(loadHandled)
  const [history, setHistory] = useState<string[]>([])
  const [detail, setDetail] = useState<EventRecord | null>(null)
  const [applyFor, setApplyFor] = useState<EventRecord | null>(null)
  const [declineFor, setDeclineFor] = useState<EventRecord | null>(null)

  const open = useMemo(
    () =>
      events.filter((e) => {
        if (e.status !== 'open') return false
        return !statsFor(e).closed
      }),
    [events, statsFor],
  )

  const deck = useMemo(() => open.filter((e) => !handled[e.id]), [open, handled])
  const top = deck[0]

  const consume = useCallback((event: EventRecord, value: 'attend' | 'decline') => {
    markHandled(event.id, value)
    setHandled(loadHandled())
    setHistory((h) => [event.id, ...h])
  }, [])

  const undo = useCallback(() => {
    const [last, ...rest] = history
    if (!last) return
    unmarkHandled(last)
    setHandled(loadHandled())
    setHistory(rest)
    toast('1件戻しました')
  }, [history, toast])

  const onSwipeRight = useCallback((e: EventRecord) => setApplyFor(e), [])

  const onSwipeLeft = useCallback(
    (e: EventRecord) => {
      consume(e, 'decline')
      setDeclineFor(e)
    },
    [consume],
  )

  if (loading) {
    return (
      <div className="grid h-[60dvh] place-items-center text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col px-4">
      <header className="flex items-baseline justify-between px-1 pt-2 pb-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">出店をさがす</h1>
          <p className="text-[13px] text-muted">
            {deck.length > 0 ? `募集中 ${deck.length} 件` : '募集中のイベント'}
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={undo}
            className="flex items-center gap-0.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
          >
            <ChevronLeftIcon size={15} />
            戻す
          </button>
        )}
      </header>

      <div className="relative h-[clamp(430px,62dvh,560px)] w-full select-none">
        <AnimatePresence initial={false}>
          {deck
            .slice(0, 3)
            .reverse()
            .map((e, revIdx, arr) => {
              const depth = arr.length - 1 - revIdx
              return depth === 0 ? (
                <SwipeCard
                  key={e.id}
                  event={e}
                  onLeft={() => onSwipeLeft(e)}
                  onRight={() => onSwipeRight(e)}
                  onTap={() => setDetail(e)}
                />
              ) : (
                <motion.div
                  key={e.id}
                  initial={false}
                  animate={{ scale: 1 - depth * 0.045, y: depth * 14, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  className="pointer-events-none absolute inset-0"
                >
                  <div className="h-full w-full overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface shadow-[var(--shadow-card)]" />
                </motion.div>
              )
            })}
        </AnimatePresence>

        {deck.length === 0 && (
          <div className="absolute inset-0 grid place-items-center rounded-[var(--radius-xl)] border border-dashed border-line">
            <EmptyState
              icon={<SparkleIcon size={22} />}
              title={open.length > 0 ? 'すべて確認しました' : '現在、募集中のイベントはありません'}
              description={
                open.length > 0
                  ? '新しい募集が公開されると、ここに並びます。見送った案件は「戻す」で引き戻せます。'
                  : '主催者がイベントを公開すると、ここに表示されます。'
              }
              action={
                history.length > 0 ? (
                  <Button size="sm" onClick={undo}>
                    直前の1件を戻す
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>

      {top && (
        <div className="flex items-center justify-center gap-3 py-5">
          <RoundButton label="見送る" onClick={() => onSwipeLeft(top)} tone="plain">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </RoundButton>
          <RoundButton label="詳細" onClick={() => setDetail(top)} tone="plain" small>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 11v6M12 7.5v.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </RoundButton>
          <RoundButton label="出店する" onClick={() => onSwipeRight(top)} tone="accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </RoundButton>
        </div>
      )}

      {top && (
        <p className="pb-4 text-center text-[12px] text-faint">
          右にスワイプで申込へ ・ 左で見送り ・ タップで詳細
        </p>
      )}

      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="イベント詳細"
        size="full"
        footer={
          detail && (
            <div className="flex gap-2">
              <Button
                full
                onClick={() => {
                  const e = detail
                  setDetail(null)
                  if (e) onSwipeLeft(e)
                }}
              >
                見送る
              </Button>
              <Button
                full
                accent
                onClick={() => {
                  const e = detail
                  setDetail(null)
                  if (e) setApplyFor(e)
                }}
              >
                このイベントに出店する
              </Button>
            </div>
          )
        }
      >
        {detail && <EventDetail event={detail} stats={statsFor(detail)} />}
      </Sheet>

      {applyFor && (
        <ApplyForm
          event={applyFor}
          stats={statsFor(applyFor)}
          onClose={() => setApplyFor(null)}
          onSubmitted={() => {
            consume(applyFor, 'attend')
            setApplyFor(null)
          }}
        />
      )}

      <DeclineSheet
        event={declineFor}
        onClose={() => setDeclineFor(null)}
        onUndo={() => {
          setDeclineFor(null)
          undo()
        }}
      />
    </div>
  )
}

/* ── swipeable top card ─────────────────────────────────── */

function SwipeCard({
  event,
  onLeft,
  onRight,
  onTap,
}: {
  event: EventRecord
  onLeft: () => void
  onRight: () => void
  onTap: () => void
}) {
  const { statsFor } = useStore()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 0, 260], [-9, 0, 9])
  const yesOpacity = useTransform(x, [30, 140], [0, 1])
  const noOpacity = useTransform(x, [-140, -30], [1, 0])
  const [exit, setExit] = useState<'left' | 'right' | null>(null)

  const stats = useMemo(() => statsFor(event), [event, statsFor])

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      whileTap={{ scale: 0.995 }}
      initial={{ scale: 0.96, y: 12, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{
        x: exit === 'right' ? 520 : exit === 'left' ? -520 : 0,
        opacity: 0,
        rotate: exit === 'right' ? 14 : exit === 'left' ? -14 : 0,
        transition: { duration: 0.28, ease: 'easeOut' },
      }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      onDragEnd={(_, info) => {
        const goRight = info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY
        const goLeft = info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY
        if (goRight) {
          setExit('right')
          onRight()
        } else if (goLeft) {
          setExit('left')
          onLeft()
        }
      }}
      onClick={() => {
        // ドラッグ直後のクリックは無視する。
        if (Math.abs(x.get()) < 6) onTap()
      }}
    >
      <EventCard event={event} stats={stats} />

      <motion.div
        style={{ opacity: yesOpacity }}
        className="pointer-events-none absolute left-5 top-5 rotate-[-10deg] rounded-[var(--radius-sm)] border-[3px] border-accent px-3 py-1 text-[17px] font-bold tracking-wide text-accent"
      >
        出店する
      </motion.div>
      <motion.div
        style={{ opacity: noOpacity }}
        className="pointer-events-none absolute right-5 top-5 rotate-[10deg] rounded-[var(--radius-sm)] border-[3px] border-[var(--c-faint)] px-3 py-1 text-[17px] font-bold tracking-wide text-faint"
      >
        見送る
      </motion.div>
    </motion.div>
  )
}

function RoundButton({
  children,
  label,
  onClick,
  tone,
  small,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  tone: 'plain' | 'accent'
  small?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className={[
        'grid place-items-center rounded-full border transition-colors duration-200',
        small ? 'h-11 w-11' : 'h-16 w-16',
        tone === 'accent'
          ? 'border-transparent bg-accent text-white shadow-[0_6px_18px_-6px_var(--c-accent)]'
          : 'border-line bg-surface text-muted hover:text-ink',
      ].join(' ')}
    >
      {children}
    </motion.button>
  )
}

/** 見送り直後の受け皿。取り消せると分かっていると、人は左にも振り切れる。 */
function DeclineSheet({
  event,
  onClose,
  onUndo,
}: {
  event: EventRecord | null
  onClose: () => void
  onUndo: () => void
}) {
  return (
    <Sheet open={Boolean(event)} onClose={onClose} title="見送りました">
      <div className="space-y-4 pb-2">
        <p className="text-[14px] leading-relaxed text-muted">
          「{event?.title}」を見送りとして記録しました。気が変わったら戻せます。
        </p>
        <div className="flex gap-2">
          <Button full onClick={onUndo}>
            やっぱり見る
          </Button>
          <Button full variant="primary" onClick={onClose}>
            次のイベントへ
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
