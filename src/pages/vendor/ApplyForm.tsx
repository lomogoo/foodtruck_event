import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { AttachmentList } from '../../components/AttachmentList'
import { CapacityMeter } from '../../components/CapacityMeter'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import {
  Badge, Button, Divider, Field, Input, KV, Segmented, Select, Spinner, Textarea, Toggle, cx,
} from '../../components/ui'
import {
  FIRE_LABEL, GAS_LABEL, POWER_LABEL, SELECTION_HINT, SELECTION_LABEL,
  fmtDate, fmtEventDates, mm, totalWatt, yen, type EventStats,
} from '../../lib/format'
import { uid } from '../../lib/db'
import { loadProfile, recordSubmission, saveProfile, type VendorProfile } from '../../lib/profile'
import { useStore } from '../../lib/store'
import type { Appliance, Attachment, EventRecord, MenuItem } from '../../lib/types'

const STEPS = ['店舗情報', '火気', '電気', '出店内容', '書類', '確認'] as const
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5

const emptyTruck = { length: 0, width: 0, height: 0, expandedLength: 0, expandedWidth: 0 }

interface FormState extends VendorProfile {
  notes: string
  files: Attachment[]
}

function initialState(): FormState {
  const p = loadProfile()
  return {
    shopName: p.shopName ?? '',
    repName: p.repName ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    fireSource: p.fireSource ?? 'none',
    gasKind: p.gasKind ?? null,
    gasKindOther: p.gasKindOther ?? '',
    gasCylinderCount: p.gasCylinderCount ?? 0,
    gasCylinderSize: p.gasCylinderSize ?? '',
    charcoalExtinguishMethod: p.charcoalExtinguishMethod ?? '',
    fireExtinguisherCount: p.fireExtinguisherCount ?? 0,
    appliances: p.appliances ?? [],
    bringsGenerator: p.bringsGenerator ?? false,
    generatorNote: p.generatorNote ?? '',
    menu: p.menu ?? [],
    foodLicenseNumber: p.foodLicenseNumber ?? '',
    hasInsurance: p.hasInsurance ?? false,
    truckSize: p.truckSize ?? emptyTruck,
    vehicleNumber: p.vehicleNumber ?? '',
    notes: '',
    files: [],
  }
}

/**
 * 申込フォーム。1画面1テーマに割り、進捗を常に見せる。
 * 「あと2ステップ」と分かっているほど人は最後まで走る（目標勾配効果）。
 */
export function ApplyForm({
  event,
  stats,
  onClose,
  onSubmitted,
}: {
  event: EventRecord
  stats: EventStats
  onClose: () => void
  onSubmitted: () => void
}) {
  const { createApplication, uploadFile } = useStore()
  const toast = useToast()
  const [step, setStep] = useState<StepIndex>(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [touched, setTouched] = useState(false)
  const dragControls = useDragControls()
  const scrollRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const watts = useMemo(() => totalWatt(form), [form])
  const overCapacity = event.powerCapacityW > 0 && watts > event.powerCapacityW

  const errors = useMemo(() => validate(form, step), [form, step])
  const canAdvance = errors.length === 0

  const go = (next: number) => {
    const clamped = Math.min(STEPS.length - 1, Math.max(0, next)) as StepIndex
    if (clamped > step && !canAdvance) {
      setTouched(true)
      toast(errors[0], 'error')
      return
    }
    setTouched(false)
    setStep(clamped)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const created = await createApplication({
        eventId: event.id,
        attendance: 'attend',
        shopName: form.shopName.trim(),
        repName: form.repName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        fireSource: form.fireSource,
        gasKind: form.fireSource === 'none' || form.fireSource === 'charcoal' ? null : form.gasKind,
        gasKindOther: form.gasKindOther,
        gasCylinderCount: form.gasCylinderCount,
        gasCylinderSize: form.gasCylinderSize,
        charcoalExtinguishMethod: form.charcoalExtinguishMethod,
        fireExtinguisherCount: form.fireExtinguisherCount,
        appliances: form.appliances,
        bringsGenerator: form.bringsGenerator,
        generatorNote: form.generatorNote,
        menu: form.menu,
        foodLicenseNumber: form.foodLicenseNumber,
        hasInsurance: form.hasInsurance,
        truckSize: form.truckSize,
        vehicleNumber: form.vehicleNumber,
        files: form.files,
        notes: form.notes,
        declineReason: '',
      })
      recordSubmission({
        id: created.id,
        eventId: event.id,
        shopName: form.shopName.trim(),
        createdAt: created.createdAt,
      })
      const { notes: _n, files: _f, ...profile } = form
      void _n
      void _f
      saveProfile(profile)
      setDone(true)
    } catch (err) {
      toast(err instanceof Error ? err.message : '送信に失敗しました', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      const uploaded: Attachment[] = []
      for (const f of Array.from(files)) {
        if (f.size > 20 * 1024 * 1024) {
          toast(`${f.name} は20MBを超えています`, 'error')
          continue
        }
        uploaded.push(await uploadFile(f))
      }
      set('files', [...form.files, ...uploaded])
      if (uploaded.length) toast(`${uploaded.length}件を添付しました`, 'ok')
    } catch (err) {
      toast(err instanceof Error ? err.message : '添付に失敗しました', 'error')
    }
  }

  if (done) {
    return (
      <Sheet open onClose={onSubmitted} title="">
        <Success event={event} stats={stats} onClose={onSubmitted} />
      </Sheet>
    )
  }

  const remain = STEPS.length - 1 - step

  return (
    <Sheet
      open
      onClose={onClose}
      size="full"
      title={
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{event.title}</span>
        </span>
      }
      footer={
        <div className="space-y-2">
          <div className="flex gap-2">
            {step > 0 && (
              <Button onClick={() => go(step - 1)} className="w-28">
                戻る
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button full accent onClick={() => go(step + 1)}>
                次へ{remain > 0 && `（あと${remain}ステップ）`}
              </Button>
            ) : (
              <Button full accent onClick={submit} disabled={submitting}>
                {submitting
                  ? <Spinner />
                  : stats.method === 'lottery'
                    ? 'この内容で抽選に応募する'
                    : 'この内容で出店を申し込む'}
              </Button>
            )}
          </div>
          <p className="text-center text-[11px] text-faint">
            {step === STEPS.length - 1
              ? SELECTION_HINT[stats.method]
              : '入力内容は端末に保存され、次回の申込で自動入力されます'}
          </p>
        </div>
      }
    >
      <ProgressHeader step={step} onJump={(i) => i < step && go(i)} />

      <motion.div
        drag="x"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onPointerDown={(e) => {
          const t = e.target as HTMLElement
          if (!t.closest('input,textarea,select,button,a,[role="switch"]')) dragControls.start(e)
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) go(step + 1)
          else if (info.offset.x > 70) go(step - 1)
        }}
        ref={scrollRef}
        className="pt-1"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-5 pb-4"
          >
            {step === 0 && <StepShop form={form} set={set} touched={touched} event={event} stats={stats} />}
            {step === 1 && <StepFire form={form} set={set} touched={touched} />}
            {step === 2 && (
              <StepPower form={form} set={set} watts={watts} event={event} overCapacity={overCapacity} />
            )}
            {step === 3 && <StepBusiness form={form} set={set} touched={touched} />}
            {step === 4 && (
              <StepDocs form={form} set={set} onPickFiles={onPickFiles} />
            )}
            {step === 5 && <StepConfirm form={form} event={event} stats={stats} watts={watts} onEdit={(i) => go(i)} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Sheet>
  )
}

/* ── validation ─────────────────────────────────────────── */

function validate(f: FormState, step: number): string[] {
  const e: string[] = []
  if (step === 0) {
    if (!f.shopName.trim()) e.push('店舗名を入力してください')
    if (!f.repName.trim()) e.push('代表者名を入力してください')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.push('メールアドレスの形式を確認してください')
    if (f.phone.replace(/[^\d]/g, '').length < 9) e.push('電話番号を入力してください')
  }
  if (step === 1 && f.fireSource !== 'none') {
    if (f.fireSource === 'gas' || f.fireSource === 'both') {
      if (!f.gasKind) e.push('ガスの種類を選択してください')
      if (f.gasKind === 'other' && !f.gasKindOther.trim()) e.push('ガスの種類を記入してください')
      if (f.gasCylinderCount <= 0) e.push('ガスボンベの本数を入力してください')
    }
    if (f.fireSource === 'charcoal' || f.fireSource === 'both') {
      if (!f.charcoalExtinguishMethod.trim()) e.push('炭の消火方法を入力してください')
    }
  }
  if (step === 3) {
    if (f.menu.filter((m) => m.name.trim()).length === 0) e.push('提供メニューを1つ以上入力してください')
    const t = f.truckSize
    if (t.length <= 0 || t.width <= 0 || t.height <= 0) e.push('キッチンカーのサイズを入力してください')
  }
  return e
}

/* ── progress ───────────────────────────────────────────── */

function ProgressHeader({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <div className="sticky top-0 z-10 -mx-5 mb-4 bg-surface px-5 pb-3 pt-1">
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => onJump(i)}
            className="group flex-1 text-left"
            aria-current={i === step}
          >
            <span
              className={cx(
                'block h-[3px] rounded-full transition-colors duration-300',
                i < step ? 'bg-ok' : i === step ? 'bg-accent' : 'bg-[var(--c-line)]',
              )}
            />
            <span
              className={cx(
                'mt-1.5 block text-[10.5px] transition-colors',
                i === step ? 'font-semibold text-ink' : 'text-faint',
              )}
            >
              {s}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── steps ──────────────────────────────────────────────── */

type SetFn = <K extends keyof FormState>(k: K, v: FormState[K]) => void

function StepShop({
  form, set, touched, event, stats,
}: {
  form: FormState; set: SetFn; touched: boolean; event: EventRecord; stats: EventStats
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-md)] bg-[var(--c-surface-2)] p-4">
        <p className="text-[12px] text-faint">申込先</p>
        <p className="mt-0.5 text-[15px] font-semibold leading-snug">{event.title}</p>
        <p className="mt-1 text-[12.5px] text-muted">
          {fmtEventDates(event)} ・ 出店料 {yen(event.fee)}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Badge tone={stats.method === 'lottery' ? 'neutral' : 'accent'}>
            {SELECTION_LABEL[stats.method]}
          </Badge>
          {stats.scarce && <Badge tone="accent">残り{stats.remaining}枠</Badge>}
          {stats.competitive && <Badge tone="accent">応募多数</Badge>}
          {stats.urgent && <Badge tone="warn">締切あと{stats.deadlineDays}日</Badge>}
        </div>
        <div className="mt-3">
          <CapacityMeter stats={stats} size="sm" />
        </div>
      </div>

      <Field label="店舗名" required error={touched && !form.shopName.trim() ? '必須項目です' : undefined}>
        <Input value={form.shopName} onChange={(e) => set('shopName', e.target.value)} placeholder="例）キッチンカー山田" autoComplete="organization" />
      </Field>
      <Field label="代表者名" required error={touched && !form.repName.trim() ? '必須項目です' : undefined}>
        <Input value={form.repName} onChange={(e) => set('repName', e.target.value)} placeholder="例）山田 太郎" autoComplete="name" />
      </Field>
      <Field label="メールアドレス" required hint="主催者からの連絡はこちらに届きます">
        <Input type="email" inputMode="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="電話番号" required hint="当日の緊急連絡に使用します">
        <Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="090-1234-5678" autoComplete="tel" />
      </Field>
    </div>
  )
}

function StepFire({ form, set, touched }: { form: FormState; set: SetFn; touched: boolean }) {
  const usesGas = form.fireSource === 'gas' || form.fireSource === 'both'
  const usesCharcoal = form.fireSource === 'charcoal' || form.fireSource === 'both'

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[13px] font-medium">火気を使用しますか？</p>
        <Segmented
          value={form.fireSource}
          onChange={(v) => set('fireSource', v)}
          options={[
            { value: 'none', label: '使わない' },
            { value: 'gas', label: 'ガス' },
            { value: 'charcoal', label: '炭' },
            { value: 'both', label: '両方' },
          ]}
          size="sm"
        />
        <p className="text-[12px] leading-relaxed text-faint">
          消防署への届出に使う情報です。正確にご記入ください。
        </p>
      </div>

      <AnimatePresence initial={false}>
        {usesGas && (
          <Reveal key="gas">
            <div className="space-y-4 rounded-[var(--radius-md)] border border-line p-4">
              <h3 className="text-[13px] font-semibold">ガスについて</h3>
              <Field label="ガスの種類" required>
                <Select
                  value={form.gasKind ?? ''}
                  onChange={(e) => set('gasKind', (e.target.value || null) as FormState['gasKind'])}
                >
                  <option value="">選択してください</option>
                  <option value="propane">プロパンガス（LPG）</option>
                  <option value="cassette">カセットボンベ</option>
                  <option value="other">その他</option>
                </Select>
              </Field>
              {form.gasKind === 'other' && (
                <Field label="種類の詳細" required>
                  <Input value={form.gasKindOther} onChange={(e) => set('gasKindOther', e.target.value)} placeholder="例）都市ガス接続" />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="本数" required error={touched && form.gasCylinderCount <= 0 ? '必須' : undefined}>
                  <Input type="number" inputMode="numeric" min={0} value={form.gasCylinderCount || ''} onChange={(e) => set('gasCylinderCount', Number(e.target.value) || 0)} placeholder="2" />
                </Field>
                <Field label="1本あたり容量" hint="例）8kg / 250g">
                  <Input value={form.gasCylinderSize} onChange={(e) => set('gasCylinderSize', e.target.value)} placeholder="8kg" />
                </Field>
              </div>
            </div>
          </Reveal>
        )}

        {usesCharcoal && (
          <Reveal key="charcoal">
            <div className="space-y-4 rounded-[var(--radius-md)] border border-line p-4">
              <h3 className="text-[13px] font-semibold">炭について</h3>
              <Field label="消火方法" required hint="例）火消し壺に移して完全消火、水バケツを常備">
                <Textarea
                  value={form.charcoalExtinguishMethod}
                  onChange={(e) => set('charcoalExtinguishMethod', e.target.value)}
                  placeholder="使用後の炭の処理方法を具体的にご記入ください"
                  className="min-h-20"
                />
              </Field>
            </div>
          </Reveal>
        )}

        {form.fireSource !== 'none' && (
          <Reveal key="extinguisher">
            <Field label="消火器の携行本数" hint="会場によっては携行が必須です">
              <Input type="number" inputMode="numeric" min={0} value={form.fireExtinguisherCount || ''} onChange={(e) => set('fireExtinguisherCount', Number(e.target.value) || 0)} placeholder="1" />
            </Field>
          </Reveal>
        )}
      </AnimatePresence>

      {form.fireSource === 'none' && (
        <p className="rounded-[var(--radius-md)] bg-ok-soft p-4 text-[13px] leading-relaxed text-ok">
          火気なしの場合、消防関連の追加書類は不要です。次へお進みください。
        </p>
      )}
    </div>
  )
}

function StepPower({
  form, set, watts, event, overCapacity,
}: {
  form: FormState; set: SetFn; watts: number; event: EventRecord; overCapacity: boolean
}) {
  const update = (id: string, patch: Partial<Appliance>) =>
    set('appliances', form.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)))

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-md)] bg-[var(--c-surface-2)] p-4">
        <p className="text-[12.5px] text-muted">このイベントの電源</p>
        <p className="mt-0.5 text-[15px] font-semibold">{POWER_LABEL[event.power]}</p>
        {event.powerCapacityW > 0 && (
          <p className="mt-0.5 text-[12.5px] text-muted tabular">
            1区画あたり {event.powerCapacityW.toLocaleString()}W まで
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">電気を使用する機器</p>
          <span
            className={cx(
              'text-[12.5px] font-semibold tabular',
              overCapacity ? 'text-danger' : 'text-muted',
            )}
          >
            合計 {watts.toLocaleString()}W
          </span>
        </div>

        {form.appliances.length === 0 && (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-line px-4 py-5 text-center text-[13px] text-faint">
            まだ登録されていません
          </p>
        )}

        <div className="space-y-2">
          {form.appliances.map((a) => (
            <div key={a.id} className="rounded-[var(--radius-sm)] border border-line p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={a.name}
                  onChange={(e) => update(a.id, { name: e.target.value })}
                  placeholder="機器名（例：冷蔵庫）"
                  className="flex-1"
                />
                <button
                  type="button"
                  aria-label="削除"
                  onClick={() => set('appliances', form.appliances.filter((x) => x.id !== a.id))}
                  className="shrink-0 px-1 text-muted transition-colors hover:text-danger"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-[var(--radius-xs)] bg-[var(--c-surface-2)] px-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={a.watt || ''}
                    onChange={(e) => update(a.id, { watt: Number(e.target.value) || 0 })}
                    placeholder="消費電力"
                    className="w-full bg-transparent py-2.5 text-[14px] outline-none tabular"
                  />
                  <span className="shrink-0 text-[12px] text-faint">W</span>
                </label>
                <label className="flex items-center gap-2 rounded-[var(--radius-xs)] bg-[var(--c-surface-2)] px-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={a.qty || ''}
                    onChange={(e) => update(a.id, { qty: Number(e.target.value) || 1 })}
                    placeholder="台数"
                    className="w-full bg-transparent py-2.5 text-[14px] outline-none tabular"
                  />
                  <span className="shrink-0 text-[12px] text-faint">台</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <Button
          full
          onClick={() => set('appliances', [...form.appliances, { id: uid(), name: '', watt: 0, qty: 1 }])}
        >
          ＋ 機器を追加
        </Button>
      </div>

      {overCapacity && (
        <p className="rounded-[var(--radius-md)] bg-warn-soft p-4 text-[13px] leading-relaxed text-warn">
          供給上限（{event.powerCapacityW.toLocaleString()}W）を超えています。発電機の持込、または主催者との事前調整が必要です。
        </p>
      )}

      <Divider />

      <div className="space-y-3">
        <Toggle
          checked={form.bringsGenerator}
          onChange={(v) => set('bringsGenerator', v)}
          label="発電機を持ち込む"
          description="会場により騒音規制がある場合があります"
        />
        {form.bringsGenerator && (
          <Field label="発電機の機種・出力" hint="例）ホンダ EU18i / 1800W">
            <Input value={form.generatorNote} onChange={(e) => set('generatorNote', e.target.value)} placeholder="機種名と出力" />
          </Field>
        )}
      </div>
    </div>
  )
}

function StepBusiness({ form, set, touched }: { form: FormState; set: SetFn; touched: boolean }) {
  const updateMenu = (id: string, patch: Partial<MenuItem>) =>
    set('menu', form.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  const t = form.truckSize
  const sizeInvalid = touched && (t.length <= 0 || t.width <= 0 || t.height <= 0)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[13px] font-medium">提供メニュー</p>
        <div className="space-y-2">
          {form.menu.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Input
                value={m.name}
                onChange={(e) => updateMenu(m.id, { name: e.target.value })}
                placeholder="メニュー名"
                className="flex-1"
              />
              <label className="flex w-28 shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-line bg-surface px-3">
                <span className="text-[12px] text-faint">¥</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={m.price || ''}
                  onChange={(e) => updateMenu(m.id, { price: Number(e.target.value) || 0 })}
                  placeholder="価格"
                  className="w-full bg-transparent py-3 text-[14px] outline-none tabular"
                />
              </label>
              <button
                type="button"
                aria-label="削除"
                onClick={() => set('menu', form.menu.filter((x) => x.id !== m.id))}
                className="shrink-0 px-1 text-muted transition-colors hover:text-danger"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <Button full onClick={() => set('menu', [...form.menu, { id: uid(), name: '', price: 0 }])}>
          ＋ メニューを追加
        </Button>
        {touched && form.menu.filter((m) => m.name.trim()).length === 0 && (
          <p className="text-[12px] text-danger">1つ以上ご入力ください</p>
        )}
      </div>

      <Divider />

      <div className="space-y-3">
        <p className="text-[13px] font-medium">キッチンカーのサイズ</p>
        <div className="grid grid-cols-3 gap-2">
          <NumField label="全長" value={t.length} onChange={(v) => set('truckSize', { ...t, length: v })} />
          <NumField label="全幅" value={t.width} onChange={(v) => set('truckSize', { ...t, width: v })} />
          <NumField label="全高" value={t.height} onChange={(v) => set('truckSize', { ...t, height: v })} />
        </div>
        <p className="text-[11.5px] text-faint">単位はmm。車検証の記載どおりにご入力ください。</p>
        {sizeInvalid && <p className="text-[12px] text-danger">全長・全幅・全高は必須です</p>}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <NumField label="展開時 全長" value={t.expandedLength} onChange={(v) => set('truckSize', { ...t, expandedLength: v })} />
          <NumField label="展開時 全幅" value={t.expandedWidth} onChange={(v) => set('truckSize', { ...t, expandedWidth: v })} />
        </div>
        <p className="text-[11.5px] text-faint">
          オーニングや販売窓を開いた状態のサイズ。区画割りに使います（任意）。
        </p>
      </div>

      <Divider />

      <Field label="車両ナンバー" hint="例）品川 500 あ 12-34（任意）">
        <Input value={form.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value)} placeholder="品川 500 あ 12-34" />
      </Field>
      <Field label="食品営業許可番号" hint="保健所の許可番号（任意）">
        <Input value={form.foodLicenseNumber} onChange={(e) => set('foodLicenseNumber', e.target.value)} placeholder="第○○○○号" />
      </Field>
      <div className="rounded-[var(--radius-md)] border border-line p-4">
        <Toggle
          checked={form.hasInsurance}
          onChange={(v) => set('hasInsurance', v)}
          label="PL保険（生産物賠償責任保険）に加入済み"
          description="加入している場合、主催者の審査で有利になります"
        />
      </div>
    </div>
  )
}

function NumField({
  label, value, onChange,
}: {
  label: string; value: number; onChange: (v: number) => void
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[12px] text-muted">{label}</span>
      <span className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-line bg-surface px-3">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="w-full bg-transparent py-3 text-[14px] outline-none tabular"
        />
        <span className="shrink-0 text-[11px] text-faint">mm</span>
      </span>
    </label>
  )
}

function StepDocs({
  form, set, onPickFiles,
}: {
  form: FormState; set: SetFn; onPickFiles: (f: FileList | null) => void
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[13px] font-medium">書類の添付</p>
        <p className="text-[12.5px] leading-relaxed text-faint">
          運転免許証・車検証・food 営業許可証・保険証書など。PDFまたは画像（1ファイル20MBまで）。
          この場で用意できない場合は、あとから主催者にメールで送っても構いません。
        </p>
      </div>

      <label className="block cursor-pointer rounded-[var(--radius-md)] border-2 border-dashed border-line px-4 py-8 text-center transition-colors hover:border-line-strong">
        <input
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            onPickFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <span className="block text-[26px] leading-none opacity-50">📎</span>
        <span className="mt-2 block text-[14px] font-medium">ファイルを選ぶ</span>
        <span className="mt-0.5 block text-[12px] text-faint">複数選択できます</span>
      </label>

      <AttachmentList
        items={form.files}
        onRemove={(id) => set('files', form.files.filter((f) => f.id !== id))}
      />

      <Field label="主催者への連絡事項" hint="搬入時間の相談、必要な区画の希望など（任意）">
        <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="ご要望があればご記入ください" />
      </Field>
    </div>
  )
}

function StepConfirm({
  form, event, stats, watts, onEdit,
}: {
  form: FormState; event: EventRecord; stats: EventStats; watts: number; onEdit: (step: number) => void
}) {
  const gas =
    form.gasKind === 'other' ? form.gasKindOther : form.gasKind ? GAS_LABEL[form.gasKind] : '—'

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-md)] bg-accent-soft p-4">
        <p className="text-[13px] font-semibold text-accent">
          最終確認 ・ {SELECTION_LABEL[stats.method]}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink">
          「{event.title}」に出店を申し込みます。
          {stats.method === 'lottery'
            ? `締切後に抽選のうえ、結果をメールでお知らせします。${
                event.resultAnnounceAt ? `（通知予定 ${fmtDate(event.resultAnnounceAt)}）` : ''
              }`
            : '先着順のため、送信の早い順に枠が確定します。主催者の確認をもって出店確定となります。'}
          {event.cancellationPolicy && ` ${event.cancellationPolicy}`}
        </p>
        <div className="mt-3">
          <CapacityMeter stats={stats} size="sm" />
        </div>
      </div>

      <ConfirmBlock title="店舗情報" onEdit={() => onEdit(0)}>
        <KV k="店舗名" v={form.shopName || '—'} />
        <KV k="代表者名" v={form.repName || '—'} />
        <KV k="メール" v={form.email || '—'} />
        <KV k="電話番号" v={form.phone || '—'} />
      </ConfirmBlock>

      <ConfirmBlock title="火気" onEdit={() => onEdit(1)}>
        <KV k="火気の使用" v={FIRE_LABEL[form.fireSource]} />
        {(form.fireSource === 'gas' || form.fireSource === 'both') && (
          <>
            <KV k="ガス種別" v={gas} />
            <KV k="本数" v={`${form.gasCylinderCount}本${form.gasCylinderSize ? `（${form.gasCylinderSize}）` : ''}`} />
          </>
        )}
        {(form.fireSource === 'charcoal' || form.fireSource === 'both') && (
          <KV k="消火方法" v={<span className="font-normal">{form.charcoalExtinguishMethod || '—'}</span>} />
        )}
        {form.fireSource !== 'none' && <KV k="消火器" v={`${form.fireExtinguisherCount}本`} />}
      </ConfirmBlock>

      <ConfirmBlock title="電気" onEdit={() => onEdit(2)}>
        {form.appliances.length === 0 ? (
          <KV k="使用機器" v="なし" />
        ) : (
          form.appliances.map((a) => (
            <KV key={a.id} k={a.name || '（無名）'} v={`${a.watt.toLocaleString()}W × ${a.qty}`} />
          ))
        )}
        <KV k="合計消費電力" v={`${watts.toLocaleString()}W`} />
        <KV k="発電機" v={form.bringsGenerator ? `持込あり${form.generatorNote ? `（${form.generatorNote}）` : ''}` : 'なし'} />
      </ConfirmBlock>

      <ConfirmBlock title="出店内容" onEdit={() => onEdit(3)}>
        <KV
          k="提供メニュー"
          v={
            <span className="font-normal">
              {form.menu.filter((m) => m.name.trim()).map((m) => `${m.name}${m.price ? ` ¥${m.price.toLocaleString()}` : ''}`).join(' / ') || '—'}
            </span>
          }
        />
        <KV k="車体サイズ" v={`${mm(form.truckSize.length)} × ${mm(form.truckSize.width)} × ${mm(form.truckSize.height)}`} />
        {form.truckSize.expandedLength > 0 && (
          <KV k="展開時" v={`${mm(form.truckSize.expandedLength)} × ${mm(form.truckSize.expandedWidth)}`} />
        )}
        {form.vehicleNumber && <KV k="車両ナンバー" v={form.vehicleNumber} />}
        {form.foodLicenseNumber && <KV k="営業許可番号" v={form.foodLicenseNumber} />}
        <KV k="PL保険" v={form.hasInsurance ? '加入済み' : '未加入'} />
      </ConfirmBlock>

      <ConfirmBlock title="書類・連絡事項" onEdit={() => onEdit(4)}>
        <KV k="添付ファイル" v={form.files.length > 0 ? `${form.files.length}件` : 'なし'} />
        {form.notes && <KV k="連絡事項" v={<span className="font-normal">{form.notes}</span>} />}
      </ConfirmBlock>
    </div>
  )
}

function ConfirmBlock({
  title, onEdit, children,
}: {
  title: string; onEdit: () => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <button onClick={onEdit} className="text-[12.5px] font-medium text-accent hover:underline">
          修正
        </button>
      </div>
      <dl className="divide-y divide-[var(--c-line)]">{children}</dl>
    </div>
  )
}

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="pt-1">{children}</div>
    </motion.div>
  )
}

/* ── success ────────────────────────────────────────────── */

function Success({
  event, stats, onClose,
}: {
  event: EventRecord; stats: EventStats; onClose: () => void
}) {
  const lottery = stats.method === 'lottery'
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="grid h-20 w-20 place-items-center rounded-full bg-ok-soft"
      >
        <motion.svg
          width="38" height="38" viewBox="0 0 24 24" fill="none"
          stroke="var(--c-ok)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        >
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>

      <div className="space-y-1.5">
        <h2 className="text-[20px] font-semibold tracking-tight">
          {lottery ? '抽選に応募しました' : '申込を受け付けました'}
        </h2>
        <p className="text-[13.5px] leading-relaxed text-muted">
          「{event.title}」への{lottery ? '応募' : '出店申込'}を主催者に送信しました。
          <br />
          {lottery
            ? `締切後に抽選し、結果をご登録のメールアドレスにご連絡します。${
                event.resultAnnounceAt ? `（通知予定 ${fmtDate(event.resultAnnounceAt)}）` : ''
              }`
            : '確認後、ご登録のメールアドレスにご連絡します。'}
        </p>
      </div>

      <div className="w-full rounded-[var(--radius-md)] bg-[var(--c-surface-2)] p-4 text-left">
        <p className="text-[12px] font-semibold text-muted">次にすること</p>
        <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed">
          <li>{lottery ? '・抽選結果の連絡をお待ちください' : '・主催者からの連絡をお待ちください'}</li>
          <li>・書類が未提出の場合は、追ってご提出ください</li>
          <li>・入力内容は保存されました。次回の申込は数タップで完了します</li>
        </ul>
      </div>

      <Button full accent size="lg" onClick={onClose}>
        次のイベントを見る
      </Button>
    </div>
  )
}
