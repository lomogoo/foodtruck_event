import { useState } from 'react'
import { AttachmentList } from '../../components/AttachmentList'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { Button, Divider, Field, Input, Segmented, Select, Spinner, Textarea, Toggle } from '../../components/ui'
import { isoToLocalInput, localInputToIso, resizeToDataUrl } from '../../lib/image'
import { useStore } from '../../lib/store'
import type { Attachment, EventDraft, EventRecord } from '../../lib/types'

const emptyDraft = (): EventDraft => {
  const start = new Date()
  start.setDate(start.getDate() + 30)
  start.setHours(10, 0, 0, 0)
  const end = new Date(start)
  end.setHours(17, 0, 0, 0)
  const deadline = new Date(start)
  deadline.setDate(deadline.getDate() - 10)
  deadline.setHours(23, 59, 0, 0)
  return {
    title: '',
    summary: '',
    venue: '',
    address: '',
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    openHours: '10:00 - 17:00',
    loadInTime: '当日 8:00 より',
    fee: 0,
    feeNote: '',
    power: 'available',
    powerCapacityW: 1500,
    water: false,
    notes: '',
    thumbnailUrl: '',
    attachments: [],
    capacity: 5,
    applicationDeadline: deadline.toISOString(),
    expectedVisitors: 0,
    organizer: '',
    contactEmail: '',
    cancellationPolicy: '開催7日前までのご連絡でキャンセル料はかかりません。',
    status: 'draft',
  }
}

const toDraft = (e: EventRecord): EventDraft => {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = e
  void _id; void _c; void _u
  return rest
}

/** イベントの新規作成／編集。公開前に下書きで寝かせられるようにしてある。 */
export function EventEditor({
  event,
  onClose,
}: {
  event: EventRecord | 'new' | null
  onClose: () => void
}) {
  const { createEvent, updateEvent, uploadFile } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState<EventDraft>(() =>
    event && event !== 'new' ? toDraft(event) : emptyDraft(),
  )
  const [saving, setSaving] = useState(false)
  const [busyThumb, setBusyThumb] = useState(false)

  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const save = async (status?: EventDraft['status']) => {
    const next = status ? { ...draft, status } : draft
    if (!next.title.trim()) {
      toast('イベント名を入力してください', 'error')
      return
    }
    setSaving(true)
    try {
      if (event === 'new' || !event) await createEvent(next)
      else await updateEvent(event.id, next)
      toast(status === 'open' ? '公開しました' : '保存しました', 'ok')
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : '保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const pickThumb = async (file: File | undefined) => {
    if (!file) return
    setBusyThumb(true)
    try {
      set('thumbnailUrl', await resizeToDataUrl(file))
    } catch (err) {
      toast(err instanceof Error ? err.message : '画像を読み込めませんでした', 'error')
    } finally {
      setBusyThumb(false)
    }
  }

  const pickDocs = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      const added: Attachment[] = []
      for (const f of Array.from(files)) {
        if (f.size > 20 * 1024 * 1024) {
          toast(`${f.name} は20MBを超えています`, 'error')
          continue
        }
        added.push(await uploadFile(f))
      }
      set('attachments', [...draft.attachments, ...added])
    } catch (err) {
      toast(err instanceof Error ? err.message : '添付に失敗しました', 'error')
    }
  }

  return (
    <Sheet
      open={Boolean(event)}
      onClose={onClose}
      size="full"
      title={event === 'new' ? 'イベントを作成' : 'イベントを編集'}
      footer={
        <div className="flex gap-2">
          <Button onClick={() => save('draft')} disabled={saving} className="flex-1">
            下書き保存
          </Button>
          <Button accent onClick={() => save('open')} disabled={saving} className="flex-[2]">
            {saving ? <Spinner /> : draft.status === 'open' ? '保存して公開を維持' : '公開する'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-4">
        <section className="space-y-4">
          <Field label="イベント名" required>
            <Input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="例）春の river side マルシェ 2026" />
          </Field>
          <Field label="概要" hint="出店者が最初に読む文章。客層と回転のイメージが伝わると申込率が上がります。">
            <Textarea value={draft.summary} onChange={(e) => set('summary', e.target.value)} placeholder="どんなイベントで、どんな来場者が集まるか" className="min-h-28" />
          </Field>

          <div className="space-y-2">
            <span className="block text-[13px] font-medium">サムネイル画像（任意）</span>
            {draft.thumbnailUrl && (
              <div className="relative">
                <img src={draft.thumbnailUrl} alt="" className="aspect-[16/9] w-full rounded-[var(--radius-md)] object-cover" />
                <button
                  onClick={() => set('thumbnailUrl', '')}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-[12px] font-medium text-white"
                >
                  削除
                </button>
              </div>
            )}
            <label className="block cursor-pointer rounded-[var(--radius-sm)] border border-dashed border-line px-4 py-4 text-center text-[13px] text-muted transition-colors hover:border-line-strong">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { pickThumb(e.target.files?.[0]); e.target.value = '' }} />
              {busyThumb ? <Spinner /> : draft.thumbnailUrl ? '画像を差し替える' : '画像を選ぶ'}
            </label>
          </div>
        </section>

        <Divider />

        <section className="space-y-4">
          <h3 className="text-[13px] font-semibold text-muted">日程・会場</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="開始日時" required>
              <Input type="datetime-local" value={isoToLocalInput(draft.startAt)} onChange={(e) => set('startAt', localInputToIso(e.target.value))} />
            </Field>
            <Field label="終了日時">
              <Input type="datetime-local" value={isoToLocalInput(draft.endAt)} onChange={(e) => set('endAt', localInputToIso(e.target.value))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="営業時間" hint="出店者が見る表記">
              <Input value={draft.openHours} onChange={(e) => set('openHours', e.target.value)} placeholder="10:00 - 17:00" />
            </Field>
            <Field label="搬入">
              <Input value={draft.loadInTime} onChange={(e) => set('loadInTime', e.target.value)} placeholder="当日 8:00 より" />
            </Field>
          </div>
          <Field label="会場名">
            <Input value={draft.venue} onChange={(e) => set('venue', e.target.value)} placeholder="市営河川敷公園 芝生広場" />
          </Field>
          <Field label="住所">
            <Input value={draft.address} onChange={(e) => set('address', e.target.value)} placeholder="東京都〇〇区…" />
          </Field>
        </section>

        <Divider />

        <section className="space-y-4">
          <h3 className="text-[13px] font-semibold text-muted">出店条件</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="出店料（円）" hint="0 で「無料」と表示されます">
              <Input type="number" inputMode="numeric" min={0} value={draft.fee || ''} onChange={(e) => set('fee', Number(e.target.value) || 0)} placeholder="15000" />
            </Field>
            <Field label="出店料の補足">
              <Input value={draft.feeNote} onChange={(e) => set('feeNote', e.target.value)} placeholder="1台1日あたり・売上歩合なし" />
            </Field>
          </div>

          <div className="space-y-2">
            <span className="block text-[13px] font-medium">電源</span>
            <Segmented
              value={draft.power}
              onChange={(v) => set('power', v)}
              options={[
                { value: 'available', label: 'あり' },
                { value: 'negotiable', label: '要相談' },
                { value: 'none', label: 'なし' },
              ]}
              size="sm"
            />
          </div>
          {draft.power !== 'none' && (
            <Field label="1区画あたりの供給上限（W）" hint="0 の場合は「未定」として扱われます">
              <Input type="number" inputMode="numeric" min={0} value={draft.powerCapacityW || ''} onChange={(e) => set('powerCapacityW', Number(e.target.value) || 0)} placeholder="1500" />
            </Field>
          )}

          <div className="rounded-[var(--radius-md)] border border-line p-4">
            <Toggle checked={draft.water} onChange={(v) => set('water', v)} label="給排水設備あり" description="会場で水が使えるか" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="募集台数" hint="残枠の表示に使われます">
              <Input type="number" inputMode="numeric" min={0} value={draft.capacity || ''} onChange={(e) => set('capacity', Number(e.target.value) || 0)} placeholder="8" />
            </Field>
            <Field label="想定来場者数" hint="出店判断で最も効く数字です">
              <Input type="number" inputMode="numeric" min={0} value={draft.expectedVisitors || ''} onChange={(e) => set('expectedVisitors', Number(e.target.value) || 0)} placeholder="8000" />
            </Field>
          </div>

          <Field label="申込締切">
            <Input type="datetime-local" value={isoToLocalInput(draft.applicationDeadline)} onChange={(e) => set('applicationDeadline', localInputToIso(e.target.value))} />
          </Field>
        </section>

        <Divider />

        <section className="space-y-4">
          <h3 className="text-[13px] font-semibold text-muted">主催者情報・その他</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="主催者名">
              <Input value={draft.organizer} onChange={(e) => set('organizer', e.target.value)} placeholder="〇〇実行委員会" />
            </Field>
            <Field label="問い合わせ先メール">
              <Input type="email" value={draft.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="event@example.jp" />
            </Field>
          </div>
          <Field label="キャンセルポリシー" hint="「後戻りできる」と分かると、その場で決めやすくなります">
            <Input value={draft.cancellationPolicy} onChange={(e) => set('cancellationPolicy', e.target.value)} placeholder="開催7日前までのご連絡でキャンセル料はかかりません。" />
          </Field>
          <Field label="備考">
            <Textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="ゴミの扱い、雨天時の対応、その他の注意事項" />
          </Field>

          <div className="space-y-2">
            <span className="block text-[13px] font-medium">添付資料（PDFなど）</span>
            <label className="block cursor-pointer rounded-[var(--radius-sm)] border border-dashed border-line px-4 py-4 text-center text-[13px] text-muted transition-colors hover:border-line-strong">
              <input type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={(e) => { pickDocs(e.target.files); e.target.value = '' }} />
              ファイルを追加
            </label>
            <AttachmentList
              items={draft.attachments}
              onRemove={(id) => set('attachments', draft.attachments.filter((a) => a.id !== id))}
            />
          </div>

          <Field label="公開状態">
            <Select value={draft.status} onChange={(e) => set('status', e.target.value as EventDraft['status'])}>
              <option value="draft">下書き（出店者には見えません）</option>
              <option value="open">募集中</option>
              <option value="closed">締切</option>
            </Select>
          </Field>
        </section>
      </div>
    </Sheet>
  )
}
