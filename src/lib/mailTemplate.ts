import { POWER_LABEL, SELECTION_LABEL, fmtDate, fmtEventDates, yen } from './format'
import type { EventRecord } from './types'

export type TemplateId = 'announce' | 'reminder' | 'list' | 'short'

export interface TemplateMeta {
  id: TemplateId
  label: string
  hint: string
}

export const TEMPLATES: TemplateMeta[] = [
  { id: 'announce', label: '出店募集のご案内', hint: '初回案内。イベントの魅力と条件をまとめて伝える' },
  { id: 'reminder', label: '締切リマインド', hint: '締切が近いイベントの再案内。残枠を強調' },
  { id: 'list', label: '一覧（箇条書き）', hint: '既存の連絡文に貼り付ける用の素うどん版' },
  { id: 'short', label: 'SNS / LINE 短文', hint: '1イベント2〜3行。グループ配信向け' },
]

export interface MailContext {
  organizerName: string
  contactEmail: string
  applyUrl: string
  /** 差し込み用の宛名。空なら「各位」。 */
  recipient: string
}

const rule = '────────────────────'

function eventBlock(e: EventRecord, i: number): string {
  const lines = [
    `【${i + 1}】${e.title}`,
    `　■ 開催日　：${fmtEventDates(e)}${e.openHours ? `　${e.openHours}` : ''}`,
    e.venue ? `　■ 会場　　：${e.venue}${e.address ? `（${e.address}）` : ''}` : '',
    `　■ 出店料　：${yen(e.fee)}${e.feeNote ? `（${e.feeNote}）` : ''}`,
    `　■ 電源　　：${POWER_LABEL[e.power]}${e.powerCapacityW > 0 ? `／1区画 ${e.powerCapacityW.toLocaleString()}W まで` : ''}`,
    e.expectedVisitors > 0 ? `　■ 想定来場：約${e.expectedVisitors.toLocaleString()}名` : '',
    e.capacity > 0
      ? `　■ 募集枠数：${e.capacity}枠（${SELECTION_LABEL[e.selectionMethod]}）`
      : `　■ 選考方法：${SELECTION_LABEL[e.selectionMethod]}`,
    e.applicationDeadline ? `　■ 申込締切：${fmtDate(e.applicationDeadline)}` : '',
    e.selectionMethod === 'lottery' && e.resultAnnounceAt
      ? `　■ 抽選結果：${fmtDate(e.resultAnnounceAt)}に通知`
      : '',
    e.loadInTime ? `　■ 搬入　　：${e.loadInTime}` : '',
    e.summary ? `　■ 概要　　：${e.summary.replace(/\n+/g, ' ')}` : '',
    e.notes ? `　■ 備考　　：${e.notes.replace(/\n+/g, ' ')}` : '',
    e.attachments.length > 0 ? `　■ 添付　　：${e.attachments.map((a) => a.name).join('、')}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

function shortBlock(e: EventRecord): string {
  return [
    `▼ ${e.title}`,
    `${fmtEventDates(e)}${e.openHours ? ` ${e.openHours}` : ''}${e.venue ? ` @${e.venue}` : ''}`,
    `出店料 ${yen(e.fee)}／${POWER_LABEL[e.power]}${e.capacity > 0 ? `／${e.capacity}枠` : ''}／${SELECTION_LABEL[e.selectionMethod]}${e.applicationDeadline ? `／締切 ${fmtDate(e.applicationDeadline, { year: false })}` : ''}`,
  ].join('\n')
}

function listBlock(e: EventRecord): string {
  return `・${e.title}｜${fmtEventDates(e)}｜${e.venue || '会場未定'}｜出店料 ${yen(e.fee)}｜${POWER_LABEL[e.power]}｜${e.capacity > 0 ? `${e.capacity}枠・` : ''}${SELECTION_LABEL[e.selectionMethod]}｜締切 ${e.applicationDeadline ? fmtDate(e.applicationDeadline, { year: false }) : '—'}`
}

export interface GeneratedMail {
  subject: string
  body: string
}

/** 選択した複数イベントを1通のメール文面に変換する。 */
export function generateMail(
  events: EventRecord[],
  template: TemplateId,
  ctx: MailContext,
): GeneratedMail {
  if (events.length === 0) return { subject: '', body: '' }

  const to = ctx.recipient.trim() || 'キッチンカー事業者 各位'
  const org = ctx.organizerName.trim() || events[0].organizer || '主催者'
  const many = events.length > 1
  const period = (() => {
    const sorted = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt))
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    return many ? `${fmtDate(first.startAt)}〜${fmtDate(last.startAt, { year: false })}` : fmtEventDates(first)
  })()

  const signature = [
    rule,
    org,
    ctx.contactEmail ? `Mail: ${ctx.contactEmail}` : '',
    ctx.applyUrl ? `お申込み: ${ctx.applyUrl}` : '',
    rule,
  ]
    .filter(Boolean)
    .join('\n')

  if (template === 'short') {
    return {
      subject: `【出店募集】${many ? `${events.length}件のイベント` : events[0].title}`,
      body: [
        `${many ? `出店募集${events.length}件のお知らせです。` : '出店募集のお知らせです。'}`,
        '',
        events.map(shortBlock).join('\n\n'),
        '',
        ctx.applyUrl ? `お申込みはこちら → ${ctx.applyUrl}` : '',
        events.some((e) => e.selectionMethod === 'first_come')
          ? '先着順のイベントは、埋まり次第締め切ります。'
          : '締切後に抽選し、結果をご連絡します。',
      ]
        .filter((l) => l !== undefined)
        .join('\n')
        .trim(),
    }
  }

  if (template === 'list') {
    return {
      subject: `出店募集イベント一覧（${events.length}件）`,
      body: [`■ 出店募集イベント一覧（${events.length}件）`, '', ...events.map(listBlock)].join('\n'),
    }
  }

  if (template === 'reminder') {
    return {
      subject: `【締切間近】${many ? `出店募集${events.length}件` : events[0].title}のご案内`,
      body: [
        `${to}`,
        '',
        `いつもお世話になっております。${org}です。`,
        `先日ご案内した出店募集について、申込締切が近づいてまいりましたので再度お知らせいたします。`,
        `${many ? '下記イベントは' : '本イベントは'}枠数に限りがあります。${
          events.some((e) => e.selectionMethod === 'first_come')
            ? '先着順のものは埋まり次第受付を終了いたします。'
            : '締切後に抽選いたします。'
        }`,
        '',
        events.map(eventBlock).join('\n\n'),
        '',
        rule,
        'すでにお申込みいただいている場合は、行き違いにつきご容赦ください。',
        'ご不明な点があれば、本メールにそのままご返信ください。',
        '',
        signature,
      ].join('\n'),
    }
  }

  return {
    subject: `【出店募集】${many ? `${period} 開催イベント ${events.length}件` : `${events[0].title}（${period}）`}のご案内`,
    body: [
      `${to}`,
      '',
      `いつもお世話になっております。${org}です。`,
      `${period}に開催予定の${many ? `イベント${events.length}件` : 'イベント'}について、キッチンカー出店者を募集いたします。`,
      '',
      events.map(eventBlock).join('\n\n'),
      '',
      rule,
      '■ お申込みについて',
      ctx.applyUrl
        ? `　下記フォームよりお申込みください（所要3分）。\n　${ctx.applyUrl}`
        : '　本メールにご返信のうえ、出店希望をお知らせください。',
      ...(() => {
        const hasFirstCome = events.some((e) => e.selectionMethod === 'first_come')
        const hasLottery = events.some((e) => e.selectionMethod === 'lottery')
        const lines: string[] = []
        if (hasFirstCome) lines.push('　先着順のイベントは、枠が埋まり次第受付を終了いたします。')
        if (hasLottery) lines.push('　抽選のイベントは、締切後に抽選のうえ結果をご連絡いたします。')
        lines.push('　お申込み後、主催者にて確認のうえ改めてご連絡いたします。')
        return lines
      })(),
      '',
      '■ お申込み時にご確認いただく内容',
      '　店舗名／代表者名／連絡先／提供メニュー／キッチンカーサイズ',
      '　火気の使用有無（ガスの種類・本数、炭の場合は消火方法）',
      '　使用する電気機器と消費電力／各種許認可書類の写し',
      '',
      'ご不明な点があれば、本メールにそのままご返信ください。',
      'ご参加をお待ちしております。',
      '',
      signature,
    ].join('\n'),
  }
}
