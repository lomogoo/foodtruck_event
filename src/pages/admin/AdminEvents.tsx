import { useMemo, useState } from 'react'
import { EventDetail } from '../../components/EventDetail'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { Badge, Button, Card, EmptyState, Segmented, Spinner } from '../../components/ui'
import { CapacityMeter } from '../../components/CapacityMeter'
import { SELECTION_LABEL, STATUS_LABEL, fmtEventDates, yen } from '../../lib/format'
import { useStore } from '../../lib/store'
import type { EventRecord } from '../../lib/types'
import { EventEditor } from './EventEditor'

type Filter = 'all' | 'open' | 'draft' | 'closed'

/** 主催者のイベント台帳。どのイベントがどれだけ埋まっているかを一覧で掴む。 */
export function AdminEvents({ onOpenApplicants }: { onOpenApplicants: (eventId: string) => void }) {
  const { events, loading, statsFor, deleteEvent, updateEvent } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<EventRecord | 'new' | null>(null)
  const [preview, setPreview] = useState<EventRecord | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<EventRecord | null>(null)

  const list = useMemo(() => {
    const filtered = filter === 'all' ? events : events.filter((e) => e.status === filter)
    return [...filtered].sort((a, b) => a.startAt.localeCompare(b.startAt))
  }, [events, filter])

  if (loading) {
    return (
      <div className="grid h-[50dvh] place-items-center text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Segmented
            value={filter}
            onChange={setFilter}
            size="sm"
            options={[
              { value: 'all', label: `すべて ${events.length}` },
              { value: 'open', label: '募集中' },
              { value: 'draft', label: '下書き' },
              { value: 'closed', label: '締切' },
            ]}
          />
        </div>
        <Button accent size="sm" onClick={() => setEditing('new')} className="shrink-0">
          ＋ 新規
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="📅"
          title="イベントがありません"
          description="「＋ 新規」から最初のイベントを作成してください。下書きで保存して、あとから公開もできます。"
          action={<Button accent onClick={() => setEditing('new')}>イベントを作成</Button>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((e) => {
            const s = statsFor(e)
            return (
              <Card key={e.id} className="overflow-hidden">
                <div className="flex gap-3 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--c-surface-2)]">
                    {e.thumbnailUrl ? (
                      <img src={e.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-[22px] opacity-30">🚐</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 truncate text-[15px] font-semibold">{e.title}</h3>
                      <Badge tone={e.status === 'open' ? 'ok' : e.status === 'draft' ? 'neutral' : 'warn'}>
                        {STATUS_LABEL[e.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted">
                      {fmtEventDates(e)} ・ {e.venue || '会場未定'} ・ {yen(e.fee)}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      <CapacityMeter stats={s} size="sm" />
                      <p className="text-[11.5px] text-faint tabular">
                        {SELECTION_LABEL[s.method]}
                        {s.deadlineDays !== null && s.deadlineDays >= 0 && ` ・ 締切まで${s.deadlineDays}日`}
                        {s.deadlineDays !== null && s.deadlineDays < 0 && ' ・ 締切済み'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex divide-x divide-[var(--c-line)] border-t border-line text-[13px]">
                  <button
                    onClick={() => onOpenApplicants(e.id)}
                    className="flex-1 py-2.5 font-medium transition-colors hover:bg-[var(--c-surface-2)]"
                  >
                    出店者 {s.applied}
                  </button>
                  <button
                    onClick={() => setPreview(e)}
                    className="flex-1 py-2.5 text-muted transition-colors hover:bg-[var(--c-surface-2)] hover:text-ink"
                  >
                    プレビュー
                  </button>
                  <button
                    onClick={() => setEditing(e)}
                    className="flex-1 py-2.5 text-muted transition-colors hover:bg-[var(--c-surface-2)] hover:text-ink"
                  >
                    編集
                  </button>
                  <button
                    onClick={() =>
                      updateEvent(e.id, { status: e.status === 'open' ? 'closed' : 'open' }).then(() =>
                        toast(e.status === 'open' ? '募集を締め切りました' : '募集を再開しました', 'ok'),
                      )
                    }
                    className="flex-1 py-2.5 text-muted transition-colors hover:bg-[var(--c-surface-2)] hover:text-ink"
                  >
                    {e.status === 'open' ? '締切' : '公開'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(e)}
                    aria-label="削除"
                    className="grid w-12 place-items-center text-muted transition-colors hover:bg-[var(--c-surface-2)] hover:text-danger"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 001 1h10a1 1 0 001-1l1-13M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <EventEditor event={editing} onClose={() => setEditing(null)} />

      <Sheet open={Boolean(preview)} onClose={() => setPreview(null)} title="出店者に見える内容" size="full">
        {preview && <EventDetail event={preview} stats={statsFor(preview)} />}
      </Sheet>

      <Sheet open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="イベントを削除">
        <div className="space-y-4 pb-2">
          <p className="text-[14px] leading-relaxed text-muted">
            「{confirmDelete?.title}」と、このイベントに紐づく申込
            {confirmDelete ? statsFor(confirmDelete).applied : 0}件をすべて削除します。この操作は取り消せません。
          </p>
          <div className="flex gap-2">
            <Button full onClick={() => setConfirmDelete(null)}>
              キャンセル
            </Button>
            <Button
              full
              variant="danger"
              onClick={async () => {
                if (!confirmDelete) return
                await deleteEvent(confirmDelete.id)
                setConfirmDelete(null)
                toast('削除しました', 'ok')
              }}
            >
              削除する
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
