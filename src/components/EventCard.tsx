import { CapacityMeter } from './CapacityMeter'
import { POWER_LABEL, SELECTION_LABEL, fmtDate, fmtEventDates, yen, type EventStats } from '../lib/format'
import type { EventRecord } from '../lib/types'
import { Badge } from './ui'

/**
 * デッキに積まれる1枚。上から順に「行きたくなる理由 → 条件 → 残り」を置く。
 * 判断に必要な数字がこの1枚で閉じることが、その場で決められるかを決める。
 */
export function EventCard({ event, stats }: { event: EventRecord; stats: EventStats }) {
  const perDay = event.fee

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] bg-surface border border-line shadow-[var(--shadow-card)]">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[var(--c-surface-2)]">
        {event.thumbnailUrl ? (
          <img
            src={event.thumbnailUrl}
            alt=""
            draggable={false}
            className="h-full w-full object-cover select-none"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-[44px] opacity-25">🚐</div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
          <span className="glass rounded-full px-3 py-1 text-[12px] font-semibold tabular shadow-[0_1px_3px_rgb(0_0_0_/_0.12)]">
            {fmtEventDates(event)}
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              tone={stats.method === 'lottery' ? 'neutral' : 'accent'}
              className="shadow-[0_1px_3px_rgb(0_0_0_/_0.12)]"
            >
              {SELECTION_LABEL[stats.method]}
            </Badge>
            {stats.scarce && (
              <Badge tone="accent" className="shadow-[0_1px_3px_rgb(0_0_0_/_0.12)]">
                残り{stats.remaining}枠
              </Badge>
            )}
            {stats.competitive && (
              <Badge tone="accent" className="shadow-[0_1px_3px_rgb(0_0_0_/_0.12)]">
                応募多数
              </Badge>
            )}
            {stats.urgent && (
              <Badge tone="warn" className="shadow-[0_1px_3px_rgb(0_0_0_/_0.12)]">
                締切あと{stats.deadlineDays}日
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <h2 className="text-[21px] font-semibold leading-snug tracking-tight line-clamp-2">
            {event.title}
          </h2>
          <p className="text-[13px] text-muted">
            {event.venue || '会場未定'}
            {event.openHours && ` ・ ${event.openHours}`}
          </p>
        </div>

        <p className="text-[13.5px] leading-relaxed text-muted line-clamp-3">{event.summary}</p>

        <div className="mt-auto space-y-3">
          <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] bg-[var(--c-surface-2)] p-3">
            <Stat label="出店料" value={yen(perDay)} strong />
            <Stat
              label="想定来場"
              value={event.expectedVisitors > 0 ? `${(event.expectedVisitors / 1000).toFixed(1).replace(/\.0$/, '')}千人` : '—'}
            />
            <Stat
              label="募集枠"
              value={event.capacity > 0 ? `${event.capacity}枠` : '未定'}
            />
          </div>

          <div className="space-y-2">
            <CapacityMeter stats={stats} size="sm" />
            <div className="flex items-center justify-between gap-3 text-[11.5px] text-faint tabular">
              <span className="truncate">
                {POWER_LABEL[event.power].replace(/（.*）/, '')}
              </span>
              <span className="shrink-0">
                {event.applicationDeadline ? `締切 ${fmtDate(event.applicationDeadline, { year: false })}` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 text-center">
      <div className="text-[11px] text-faint">{label}</div>
      <div
        className={
          strong
            ? 'truncate text-[17px] font-semibold tabular leading-tight'
            : 'truncate text-[13.5px] font-medium leading-tight mt-0.5'
        }
      >
        {value}
      </div>
    </div>
  )
}
