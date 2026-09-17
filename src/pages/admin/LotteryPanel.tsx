import { useMemo, useState } from 'react'
import { CapacityMeter } from '../../components/CapacityMeter'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { Button, Card, Spinner } from '../../components/ui'
import { fmtDate, type EventStats } from '../../lib/format'
import { useStore } from '../../lib/store'
import type { ApplicationRecord, EventRecord } from '../../lib/types'

/** 偏りのないシャッフル（Fisher–Yates）。乱数は暗号品質のものを使う。 */
function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  const rand = new Uint32Array(1)
  for (let i = out.length - 1; i > 0; i--) {
    crypto.getRandomValues(rand)
    const j = rand[0] % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * 抽選イベントの当選者を決める。
 * 承認済みはすでに確定した枠として残し、確認待ちの中から残りの枠を埋める。
 */
export function LotteryPanel({
  event,
  stats,
  applications,
}: {
  event: EventRecord
  stats: EventStats
  applications: ApplicationRecord[]
}) {
  const { db, refresh } = useStore()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [running, setRunning] = useState(false)

  const { pending, approved, seats } = useMemo(() => {
    const scoped = applications.filter((a) => a.eventId === event.id && a.attendance === 'attend')
    const approvedCount = scoped.filter((a) => a.status === 'approved').length
    return {
      pending: scoped.filter((a) => a.status === 'pending'),
      approved: approvedCount,
      seats: Math.max(0, event.capacity - approvedCount),
    }
  }, [applications, event.id, event.capacity])

  const deadlinePassed = stats.deadlineDays !== null && stats.deadlineDays < 0
  const canDraw = event.capacity > 0 && pending.length > 0

  const draw = async () => {
    if (!db) return
    setRunning(true)
    try {
      const shuffled = shuffle(pending)
      const winners = shuffled.slice(0, seats)
      const losers = shuffled.slice(seats)
      for (const a of winners) await db.updateApplicationStatus(a.id, 'approved')
      for (const a of losers) await db.updateApplicationStatus(a.id, 'rejected')
      await refresh()
      setConfirming(false)
      toast(`抽選しました：当選${winners.length}件 / 落選${losers.length}件`, 'ok')
    } catch (err) {
      toast(err instanceof Error ? err.message : '抽選に失敗しました', 'error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <Card className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold">抽選</h3>
            <p className="mt-0.5 text-[12.5px] text-muted">
              確認待ち{pending.length}件から、残り{seats}枠を無作為に選びます
            </p>
          </div>
          <span className="shrink-0 text-right text-[13px] font-semibold tabular">
            {/* 倍率は1倍以上でしか意味を持たない。割っている間は実数で見せる。 */}
            {stats.ratio !== null && stats.ratio >= 1
              ? `${stats.ratio.toFixed(1)}倍`
              : `${stats.applied} / ${stats.capacity}`}
          </span>
        </div>

        <CapacityMeter stats={stats} size="sm" />

        {!deadlinePassed && event.applicationDeadline && (
          <p className="rounded-[var(--radius-sm)] bg-warn-soft px-3 py-2 text-[12px] leading-relaxed text-warn">
            まだ受付中です（締切 {fmtDate(event.applicationDeadline)}）。
            締切前に抽選すると、その後の応募が落選扱いになりません。
          </p>
        )}

        <Button
          full
          accent={deadlinePassed}
          disabled={!canDraw}
          onClick={() => setConfirming(true)}
        >
          {event.capacity <= 0
            ? '募集枠数が未設定です'
            : pending.length === 0
              ? '抽選対象の応募がありません'
              : '抽選を実行する'}
        </Button>
      </Card>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="抽選の実行">
        <div className="space-y-4 pb-2">
          <p className="text-[14px] leading-relaxed text-muted">
            「{event.title}」の確認待ち{pending.length}件から
            <span className="font-semibold text-ink">{Math.min(seats, pending.length)}件</span>
            を無作為に選び、当選として承認します。
            残りの{Math.max(0, pending.length - seats)}件は見送りになります。
            {approved > 0 && ` 承認済みの${approved}件はそのまま確定枠として扱います。`}
          </p>
          <p className="text-[13px] leading-relaxed text-danger">
            この操作は取り消せません。実行前に応募の締切をご確認ください。
          </p>
          <div className="flex gap-2">
            <Button full onClick={() => setConfirming(false)} disabled={running}>
              キャンセル
            </Button>
            <Button full accent onClick={draw} disabled={running}>
              {running ? <Spinner /> : '抽選する'}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  )
}
