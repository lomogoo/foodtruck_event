import { useMemo, useState } from 'react'
import { EventDetail } from '../../components/EventDetail'
import { Sheet } from '../../components/Sheet'
import { Badge, Card, EmptyState, KV } from '../../components/ui'
import { APP_STATUS_LABEL, eventStats, fmtDateTime, fmtEventDates, yen } from '../../lib/format'
import { loadProfile } from '../../lib/profile'
import { useStore } from '../../lib/store'
import type { ApplicationRecord, EventRecord } from '../../lib/types'

const TONE: Record<ApplicationRecord['status'], 'neutral' | 'accent' | 'ok' | 'warn'> = {
  pending: 'warn',
  approved: 'ok',
  rejected: 'neutral',
  withdrawn: 'neutral',
}

/** 出店者が自分の申込を追う画面。「今どうなっているか」だけを返す。 */
export function MyApplications() {
  const { events, applications } = useStore()
  const email = loadProfile().email?.trim().toLowerCase()
  const [detail, setDetail] = useState<EventRecord | null>(null)

  const mine = useMemo(
    () =>
      applications.filter(
        (a) => a.attendance === 'attend' && (!email || a.email.trim().toLowerCase() === email),
      ),
    [applications, email],
  )

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-4 px-4 pb-8">
      <header className="px-1 pt-2 pb-1">
        <h1 className="text-[26px] font-semibold tracking-tight">申込状況</h1>
        <p className="text-[13px] text-muted">{mine.length}件の申込</p>
      </header>

      {mine.length === 0 ? (
        <EmptyState
          icon="📋"
          title="まだ申込はありません"
          description="「さがす」タブでイベントを右にスワイプすると、ここに記録されます。"
        />
      ) : (
        <div className="space-y-3">
          {mine.map((a) => {
            const event = events.find((e) => e.id === a.eventId)
            return (
              <Card
                key={a.id}
                className="p-4"
                onClick={event ? () => setDetail(event) : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">
                      {event?.title ?? '（削除されたイベント）'}
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {event ? `${fmtEventDates(event)} ・ ${yen(event.fee)}` : '—'}
                    </p>
                  </div>
                  <Badge tone={TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
                </div>
                <dl className="mt-2 divide-y divide-[var(--c-line)] border-t border-line pt-1">
                  <KV k="店舗名" v={a.shopName} />
                  <KV k="申込日時" v={fmtDateTime(a.createdAt)} />
                </dl>
                {a.status === 'pending' && (
                  <p className="mt-2 text-[12px] text-faint">主催者が確認中です。連絡をお待ちください。</p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={Boolean(detail)} onClose={() => setDetail(null)} title="イベント詳細" size="full">
        {detail && <EventDetail event={detail} stats={eventStats(detail, applications)} />}
      </Sheet>
    </div>
  )
}
