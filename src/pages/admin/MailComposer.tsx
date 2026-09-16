import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/Toast'
import { Badge, Button, Card, Divider, EmptyState, Field, Input, Segmented, cx } from '../../components/ui'
import { STATUS_LABEL, eventStats, fmtEventDates, yen } from '../../lib/format'
import { TEMPLATES, generateMail, type TemplateId } from '../../lib/mailTemplate'
import { useStore } from '../../lib/store'

const CTX_KEY = 'mk.mail-context'

const applyUrlDefault = () => `${location.origin}${location.pathname}#/vendor`

/**
 * 募集中イベントを選んで、そのまま送れる文面に変換する。
 * 主催者が毎回ゼロから書いている作業を、選択とコピーだけに畳む。
 */
export function MailComposer() {
  const { events, applications } = useStore()
  const toast = useToast()

  const [template, setTemplate] = useState<TemplateId>('announce')
  const [selected, setSelected] = useState<string[]>([])
  const [ctx, setCtx] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CTX_KEY) ?? '{}')
      return {
        organizerName: saved.organizerName ?? '',
        contactEmail: saved.contactEmail ?? '',
        applyUrl: saved.applyUrl ?? applyUrlDefault(),
        recipient: saved.recipient ?? '',
      }
    } catch {
      return { organizerName: '', contactEmail: '', applyUrl: applyUrlDefault(), recipient: '' }
    }
  })
  const [edited, setEdited] = useState<string | null>(null)

  const candidates = useMemo(
    () => events.filter((e) => e.status !== 'draft').sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [events],
  )

  // 初回は募集中をまとめて選んでおく。ほとんどの場合これがそのまま正解になる。
  useEffect(() => {
    if (selected.length === 0 && candidates.length > 0) {
      const open = candidates.filter((e) => e.status === 'open').map((e) => e.id)
      if (open.length > 0) setSelected(open)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.length])

  useEffect(() => {
    localStorage.setItem(CTX_KEY, JSON.stringify(ctx))
  }, [ctx])

  const chosen = useMemo(
    () => selected.map((id) => candidates.find((e) => e.id === id)).filter((e) => e !== undefined),
    [selected, candidates],
  )

  const mail = useMemo(() => generateMail(chosen, template, ctx), [chosen, template, ctx])
  // 生成結果が変わったら手編集は破棄する。
  useEffect(() => setEdited(null), [mail.body])

  const body = edited ?? mail.body

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${label}をコピーしました`, 'ok')
    } catch {
      toast('コピーできませんでした。手動で選択してください', 'error')
    }
  }

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  if (candidates.length === 0) {
    return (
      <EmptyState
        icon="✉️"
        title="文面にできるイベントがありません"
        description="下書き以外のイベントが対象です。イベントを公開してからお試しください。"
      />
    )
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold">1. イベントを選ぶ</h2>
          <div className="flex gap-3 text-[12.5px]">
            <button
              onClick={() => setSelected(candidates.filter((e) => e.status === 'open').map((e) => e.id))}
              className="text-accent hover:underline"
            >
              募集中をすべて
            </button>
            <button onClick={() => setSelected([])} className="text-muted hover:text-ink">
              解除
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {candidates.map((e) => {
            const on = selected.includes(e.id)
            const s = eventStats(e, applications)
            return (
              <button
                key={e.id}
                onClick={() => toggle(e.id)}
                className={cx(
                  'flex w-full items-start gap-3 rounded-[var(--radius-md)] border p-3.5 text-left transition-colors',
                  on ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <span
                  className={cx(
                    'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                    on ? 'border-accent bg-accent text-white' : 'border-line-strong',
                  )}
                >
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate text-[14px] font-medium">{e.title}</span>
                    {e.status !== 'open' && <Badge>{STATUS_LABEL[e.status]}</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted">
                    {fmtEventDates(e)} ・ {yen(e.fee)}
                    {s.remaining !== null && s.remaining > 0 && ` ・ 残り${s.remaining}枠`}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <Divider />

      <section className="space-y-2.5">
        <h2 className="px-1 text-[13px] font-semibold">2. テンプレートを選ぶ</h2>
        <Segmented
          value={template}
          onChange={setTemplate}
          size="sm"
          options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
        />
        <p className="px-1 text-[12px] text-faint">
          {TEMPLATES.find((t) => t.id === template)?.hint}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="宛名" hint="空欄なら「キッチンカー事業者 各位」">
            <Input value={ctx.recipient} onChange={(e) => setCtx({ ...ctx, recipient: e.target.value })} placeholder="〇〇様" />
          </Field>
          <Field label="差出人（主催者名）">
            <Input value={ctx.organizerName} onChange={(e) => setCtx({ ...ctx, organizerName: e.target.value })} placeholder="〇〇実行委員会" />
          </Field>
          <Field label="問い合わせ先メール">
            <Input type="email" value={ctx.contactEmail} onChange={(e) => setCtx({ ...ctx, contactEmail: e.target.value })} placeholder="event@example.jp" />
          </Field>
          <Field label="申込ページURL" hint="出店者に案内するリンク">
            <Input value={ctx.applyUrl} onChange={(e) => setCtx({ ...ctx, applyUrl: e.target.value })} />
          </Field>
        </div>
      </section>

      <Divider />

      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold">3. 文面をコピーする</h2>
          <span className="text-[12px] text-faint tabular">
            {chosen.length}件 ・ {body.length.toLocaleString()}文字
          </span>
        </div>

        {chosen.length === 0 ? (
          <Card className="p-6 text-center text-[13px] text-muted">
            イベントを1件以上選んでください
          </Card>
        ) : (
          <>
            <Field label="件名">
              <div className="flex gap-2">
                <Input value={mail.subject} readOnly className="flex-1" />
                <Button className="shrink-0" onClick={() => copy(mail.subject, '件名')}>
                  コピー
                </Button>
              </div>
            </Field>

            <Field label="本文" hint="この場で編集してからコピーもできます">
              <textarea
                value={body}
                onChange={(e) => setEdited(e.target.value)}
                spellCheck={false}
                className="min-h-[340px] w-full resize-y rounded-[var(--radius-sm)] border border-line bg-surface p-4 text-[13px] leading-relaxed focus:border-line-strong focus:outline-none"
              />
            </Field>

            <div className="space-y-2">
              <Button accent full size="lg" onClick={() => copy(body, '本文')}>
                本文をコピー
              </Button>
              <div className="flex gap-2">
              <Button onClick={() => copy(`${mail.subject}\n\n${body}`, '件名と本文')} className="flex-1">
                件名＋本文
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const href = `mailto:?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(body)}`
                  if (href.length > 1800) {
                    copy(body, '本文')
                    toast('本文が長いためコピーしました。メールに貼り付けてください')
                    return
                  }
                  location.href = href
                }}
              >
                メールで開く
              </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
