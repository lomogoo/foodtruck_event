import type { ApplicationRecord, EventRecord } from './types'

const WD = ['日', '月', '火', '水', '木', '金', '土']

export const yen = (n: number) => (n > 0 ? `¥${n.toLocaleString('ja-JP')}` : '無料')

export function fmtDate(iso: string, opts: { year?: boolean } = {}) {
  if (!iso) return '未定'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '未定'
  const y = opts.year === false ? '' : `${d.getFullYear()}年`
  return `${y}${d.getMonth() + 1}月${d.getDate()}日(${WD[d.getDay()]})`
}

export function fmtDateTime(iso: string) {
  if (!iso) return '未定'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '未定'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${fmtDate(iso)} ${hh}:${mm}`
}

/** 開催日を1行で。単日なら1日分、複数日ならレンジ表記。 */
export function fmtEventDates(e: Pick<EventRecord, 'startAt' | 'endAt'>) {
  if (!e.startAt) return '日程未定'
  const s = new Date(e.startAt)
  const t = e.endAt ? new Date(e.endAt) : s
  const sameDay = s.toDateString() === t.toDateString()
  return sameDay ? fmtDate(e.startAt) : `${fmtDate(e.startAt)} 〜 ${fmtDate(e.endAt, { year: false })}`
}

/** 締切までの残り日数。過ぎていれば負数。 */
export function daysUntil(iso: string): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((t - today.getTime()) / 86_400_000)
}

export const isPast = (iso: string) => {
  const n = daysUntil(iso)
  return n !== null && n < 0
}

/** 出店者に見せる需給サマリ。希少性・社会的証明の表示に使う。 */
export interface EventStats {
  applied: number
  remaining: number | null
  fillRate: number
  deadlineDays: number | null
  /** 残りわずか（2枠以下、または充足率80%以上）。 */
  scarce: boolean
  /** 締切間近（3日以内）。 */
  urgent: boolean
  closed: boolean
}

export function eventStats(e: EventRecord, apps: ApplicationRecord[]): EventStats {
  const applied = apps.filter(
    (a) => a.eventId === e.id && a.attendance === 'attend' && a.status !== 'rejected' && a.status !== 'withdrawn',
  ).length
  const remaining = e.capacity > 0 ? Math.max(0, e.capacity - applied) : null
  const fillRate = e.capacity > 0 ? Math.min(1, applied / e.capacity) : 0
  const deadlineDays = daysUntil(e.applicationDeadline)
  return {
    applied,
    remaining,
    fillRate,
    deadlineDays,
    scarce: remaining !== null && (remaining <= 2 || fillRate >= 0.8) && remaining > 0,
    urgent: deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 3,
    closed:
      e.status === 'closed' ||
      remaining === 0 ||
      (deadlineDays !== null && deadlineDays < 0) ||
      isPast(e.startAt),
  }
}

export const POWER_LABEL: Record<EventRecord['power'], string> = {
  none: '電源なし（発電機持込）',
  available: '電源あり',
  negotiable: '電源は要相談',
}

export const STATUS_LABEL: Record<EventRecord['status'], string> = {
  draft: '下書き',
  open: '募集中',
  closed: '締切',
}

export const APP_STATUS_LABEL: Record<ApplicationRecord['status'], string> = {
  pending: '確認待ち',
  approved: '承認済み',
  rejected: '見送り',
  withdrawn: '取下げ',
}

export const FIRE_LABEL: Record<ApplicationRecord['fireSource'], string> = {
  none: '火気なし',
  gas: 'ガス',
  charcoal: '炭',
  both: 'ガス＋炭',
}

export const GAS_LABEL: Record<NonNullable<ApplicationRecord['gasKind']>, string> = {
  propane: 'プロパンガス',
  cassette: 'カセットボンベ',
  other: 'その他',
}

export const totalWatt = (a: Pick<ApplicationRecord, 'appliances'>) =>
  a.appliances.reduce((sum, x) => sum + (x.watt || 0) * (x.qty || 1), 0)

export const mm = (v: number) => (v > 0 ? `${(v / 1000).toFixed(2)}m` : '—')

export const bytes = (n: number) =>
  n < 1024 ? `${n}B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)}KB` : `${(n / 1024 ** 2).toFixed(1)}MB`
