import {
  POWER_LABEL, SELECTION_HINT, SELECTION_LABEL,
  fmtDate, fmtDateTime, fmtEventDates, yen, type EventStats,
} from '../lib/format'
import type { EventRecord } from '../lib/types'
import { AttachmentList } from './AttachmentList'
import { CapacityMeter } from './CapacityMeter'
import { Badge, Divider, KV } from './ui'

/** シート内に出す詳細。申込前の最後の確認になるので、迷いを残さない順に並べる。 */
export function EventDetail({ event, stats }: { event: EventRecord; stats: EventStats }) {
  return (
    <div className="space-y-5 pb-2">
      {event.thumbnailUrl && (
        <img
          src={event.thumbnailUrl}
          alt=""
          className="aspect-[16/9] w-full rounded-[var(--radius-md)] object-cover"
        />
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={stats.method === 'lottery' ? 'neutral' : 'accent'}>
            {SELECTION_LABEL[stats.method]}
          </Badge>
          {stats.scarce && <Badge tone="accent">残り{stats.remaining}枠</Badge>}
          {stats.competitive && <Badge tone="accent">応募多数</Badge>}
          {stats.urgent && <Badge tone="warn">締切あと{stats.deadlineDays}日</Badge>}
        </div>
        <h2 className="text-[22px] font-semibold leading-snug tracking-tight">{event.title}</h2>
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted">{event.summary}</p>
      </div>

      <div className="space-y-2.5 rounded-[var(--radius-md)] border border-line p-4">
        <CapacityMeter stats={stats} />
        <p className="text-[12.5px] leading-relaxed text-muted">
          <span className="font-medium text-ink">{SELECTION_LABEL[stats.method]}</span>
          ：{SELECTION_HINT[stats.method]}
          {stats.method === 'lottery' && event.resultAnnounceAt &&
            `（結果通知 ${fmtDate(event.resultAnnounceAt)}）`}
        </p>
      </div>

      <Divider />

      <dl className="divide-y divide-[var(--c-line)]">
        <KV k="開催日" v={fmtEventDates(event)} />
        {event.openHours && <KV k="営業時間" v={event.openHours} />}
        {event.loadInTime && <KV k="搬入" v={event.loadInTime} />}
        <KV k="会場" v={event.venue || '未定'} />
        {event.address && <KV k="住所" v={<span className="font-normal">{event.address}</span>} />}
        <KV
          k="出店料"
          v={
            <span>
              {yen(event.fee)}
              {event.feeNote && <span className="block text-[11.5px] font-normal text-faint">{event.feeNote}</span>}
            </span>
          }
        />
        <KV
          k="電源"
          v={
            <span>
              {POWER_LABEL[event.power]}
              {event.powerCapacityW > 0 && (
                <span className="block text-[11.5px] font-normal text-faint">
                  1区画 {event.powerCapacityW.toLocaleString()}W まで
                </span>
              )}
            </span>
          }
        />
        <KV k="給排水" v={event.water ? 'あり' : 'なし（各自ご用意ください）'} />
        {event.expectedVisitors > 0 && (
          <KV k="想定来場者数" v={`約${event.expectedVisitors.toLocaleString()}名`} />
        )}
        {event.capacity > 0 && <KV k="募集枠数" v={`${event.capacity}枠`} />}
        <KV k="選考方法" v={SELECTION_LABEL[stats.method]} />
        {stats.method === 'lottery' && event.resultAnnounceAt && (
          <KV k="抽選結果の通知" v={fmtDate(event.resultAnnounceAt)} />
        )}
        {event.applicationDeadline && (
          <KV k="申込締切" v={fmtDateTime(event.applicationDeadline)} />
        )}
        {event.organizer && <KV k="主催" v={event.organizer} />}
        {event.contactEmail && (
          <KV
            k="問い合わせ"
            v={
              <a href={`mailto:${event.contactEmail}`} className="text-accent hover:underline">
                {event.contactEmail}
              </a>
            }
          />
        )}
      </dl>

      {event.notes && (
        <div className="rounded-[var(--radius-md)] bg-[var(--c-surface-2)] p-4">
          <h3 className="mb-1.5 text-[12.5px] font-semibold text-muted">備考</h3>
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{event.notes}</p>
        </div>
      )}

      {event.attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[12.5px] font-semibold text-muted">資料</h3>
          <AttachmentList items={event.attachments} />
        </div>
      )}

      {/* 損失回避を和らげる一言。ここが無いと「その場で決める」の心理的コストが跳ね上がる。 */}
      {event.cancellationPolicy && (
        <div className="rounded-[var(--radius-md)] border border-line bg-ok-soft/60 p-4">
          <p className="text-[13px] leading-relaxed text-ink">
            <span className="mr-1.5 font-semibold text-ok">キャンセルについて</span>
            {event.cancellationPolicy}
          </p>
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-faint">
        {stats.method === 'lottery'
          ? '申込＝当選ではありません。締切後に抽選のうえ、結果をご連絡します。'
          : '申込＝確定ではありません。主催者の確認後に改めてご連絡します。'}
        {event.applicationDeadline && `（締切: ${fmtDate(event.applicationDeadline)}）`}
      </p>
    </div>
  )
}
