import { useMemo, useState } from 'react'
import { EventDetail } from '../../components/EventDetail'
import { Sheet } from '../../components/Sheet'
import { Badge, Card, EmptyState, KV } from '../../components/ui'
import { APP_STATUS_LABEL, fmtDateTime, fmtEventDates, yen } from '../../lib/format'
import { loadSubmissions } from '../../lib/profile'
import { useStore } from '../../lib/store'
import type { ApplicationRecord, EventRecord } from '../../lib/types'

const TONE: Record<ApplicationRecord['status'], 'neutral' | 'accent' | 'ok' | 'warn'> = {
  pending: 'warn',
  approved: 'ok',
  rejected: 'neutral',
  withdrawn: 'neutral',
}

/**
 * 出店者が自分の申込を追う画面。
 * 申込の中身はサーバ側で本人にも読ませない設計なので、表示は端末に残した
 * 控えを基準にし、主催者としてログインしている場合だけ最新の状態を重ねる。
 */
export function MyApplications() {
  const { events, applications, statsFor } = useStore()
  const [detail, setDetail] = useState<EventRecord | null>(null)
  const submissions = useMemo(loadSubmissions, [])

  const rows = useMemo(
    () =>
      submissions.map((s) => {
        const server = applications.find((a) => a.id === s.id)
        return {
          key: s.id,
          eventId: s.eventId,
          shopName: server?.shopName ?? s.shopName,
          createdAt: server?.createdAt ?? s.createdAt,
          status: server?.status ?? null,
        }
      }),
    [submissions, applications],
  )

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-4 px-4 pb-8">
      <header className="px-1 pt-2 pb-1">
        <h1 className="text-[26px] font-semibold tracking-tight">申込状況</h1>
        <p className="text-[13px] text-muted">{rows.length}件の申込</p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon="📋"
          title="まだ申込はありません"
          description="「さがす」タブでイベントを右にスワイプすると、ここに記録されます。"
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const event = events.find((e) => e.id === r.eventId)
            return (
              <Card key={r.key} className="p-4" onClick={event ? () => setDetail(event) : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">
                      {event?.title ?? '（公開が終了したイベント）'}
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {event ? `${fmtEventDates(event)} ・ ${yen(event.fee)}` : '—'}
                    </p>
                  </div>
                  <Badge tone={r.status ? TONE[r.status] : 'warn'}>
                    {r.status ? APP_STATUS_LABEL[r.status] : '送信済み'}
                  </Badge>
                </div>
                <dl className="mt-2 divide-y divide-[var(--c-line)] border-t border-line pt-1">
                  <KV k="店舗名" v={r.shopName} />
                  <KV k="申込日時" v={fmtDateTime(r.createdAt)} />
                </dl>
                <p className="mt-2 text-[12px] leading-relaxed text-faint">
                  {r.status === 'approved'
                    ? '出店が承認されました。当日の詳細は主催者からの連絡をご確認ください。'
                    : r.status === 'rejected'
                      ? '今回は見送りとなりました。'
                      : '主催者が確認中です。結果はご登録のメールアドレスにご連絡します。'}
                </p>
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={Boolean(detail)} onClose={() => setDetail(null)} title="イベント詳細" size="full">
        {detail && <EventDetail event={detail} stats={statsFor(detail)} />}
      </Sheet>
    </div>
  )
}
