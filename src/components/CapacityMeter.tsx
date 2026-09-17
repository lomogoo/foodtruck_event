import { motion } from 'framer-motion'
import { SELECTION_LABEL, type EventStats } from '../lib/format'
import { cx } from './ui'

/**
 * 枠の埋まり具合。出店者と主催者が同じ数字を見るように、表示はここ1箇所に寄せる。
 *
 * 先着は「あと何枠か」、抽選は「何倍か」が判断材料になるので、
 * 同じメーターでも読ませる数字を変える。
 */
export function CapacityMeter({
  stats,
  size = 'md',
  showLabel = true,
}: {
  stats: EventStats
  size?: 'sm' | 'md'
  showLabel?: boolean
}) {
  const { method, capacity, applied, remaining, fillRate, ratio, full } = stats
  const lottery = method === 'lottery'

  if (capacity <= 0) {
    return showLabel ? (
      <p className={cx('text-faint tabular', size === 'sm' ? 'text-[11.5px]' : 'text-[12px]')}>
        {SELECTION_LABEL[method]} ・ 枠数未定
        {applied > 0 && ` ・ ${applied}件の申込`}
      </p>
    ) : null
  }

  // 抽選で定員を超えた分は、バーからはみ出す帯として別に見せる。
  const overflow = lottery && ratio !== null && ratio > 1

  const left = lottery
    ? `全${capacity}枠に ${applied}件の応募`
    : `全${capacity}枠中 ${applied}枠が申込済み`

  const right = lottery
    ? ratio !== null && ratio >= 1
      ? `倍率 ${ratio.toFixed(1)}倍`
      : `残り${remaining}枠`
    : full
      ? '満了'
      : `残り${remaining}枠`

  return (
    <div className={size === 'sm' ? 'space-y-1' : 'space-y-1.5'}>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--c-line)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(fillRate * 100)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          className={cx(
            'h-full rounded-full',
            overflow ? 'bg-accent' : full ? 'bg-ok' : 'bg-accent',
          )}
        />
        {overflow && (
          // 定員超過は縞で示す。バーは満タンのまま、超えていることだけ伝える。
          <div
            className="absolute inset-0 rounded-full opacity-35"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, transparent 0 5px, rgb(255 255 255 / 0.9) 5px 10px)',
            }}
          />
        )}
      </div>

      {showLabel && (
        <div
          className={cx(
            'flex items-baseline justify-between gap-3 tabular',
            size === 'sm' ? 'text-[11.5px]' : 'text-[12px]',
          )}
        >
          <span className="min-w-0 truncate text-faint">{left}</span>
          <span
            className={cx(
              'shrink-0 font-medium',
              full || overflow ? 'text-accent' : 'text-muted',
            )}
          >
            {right}
          </span>
        </div>
      )}
    </div>
  )
}
