import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/* ── Button ─────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-[var(--c-surface)] hover:opacity-90 active:opacity-80',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong',
  ghost: 'text-muted hover:text-ink hover:bg-[var(--c-surface-2)]',
  danger: 'text-danger border border-line hover:bg-[var(--c-surface-2)]',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-[var(--radius-xs)]',
  md: 'h-11 px-5 text-[15px] rounded-[var(--radius-sm)]',
  lg: 'h-14 px-6 text-[16px] rounded-[var(--radius-md)]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
  accent?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  full,
  accent,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-medium select-none',
        'transition-[opacity,transform,border-color,background-color] duration-200',
        'active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
        accent ? 'bg-accent text-white hover:brightness-105 active:brightness-95' : VARIANT[variant],
        SIZE[size],
        full && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ── Surfaces ───────────────────────────────────────────── */

export function Card({
  className,
  children,
  onClick,
}: {
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'bg-surface border border-line rounded-[var(--radius-lg)]',
        onClick && 'cursor-pointer transition-transform duration-200 active:scale-[0.99]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Section({
  title,
  description,
  children,
  action,
}: {
  title?: string
  description?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="space-y-3">
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
            {description && <p className="text-[13px] text-muted mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/* ── Badges & chips ─────────────────────────────────────── */

type Tone = 'neutral' | 'accent' | 'ok' | 'warn'

const TONE: Record<Tone, string> = {
  neutral: 'bg-[var(--c-surface-2)] text-muted border-line',
  accent: 'bg-accent-soft text-accent border-transparent',
  ok: 'bg-ok-soft text-ok border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
        'text-[11.5px] font-medium leading-5 whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ── Form fields ────────────────────────────────────────── */

const FIELD_BASE =
  'w-full bg-surface border border-line rounded-[var(--radius-sm)] px-3.5 py-3 text-[15px] ' +
  'placeholder:text-faint transition-colors duration-150 focus:border-line-strong focus:outline-none ' +
  'focus-visible:outline-2 focus-visible:outline-accent'

export function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline gap-2">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {required && <span className="text-[11px] text-accent font-medium">必須</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-[12px] text-danger">{error}</span>
      ) : (
        hint && <span className="block text-[12px] text-faint leading-snug">{hint}</span>
      )}
    </label>
  )
}

export const Input = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...rest} className={cx(FIELD_BASE, className)} />
)

export const Textarea = ({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...rest} className={cx(FIELD_BASE, 'resize-y min-h-24 leading-relaxed', className)} />
)

export const Select = ({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...rest} className={cx(FIELD_BASE, 'appearance-none pr-9 bg-no-repeat', className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' stroke='%239b9ba3' stroke-width='1.8' stroke-linecap='round'><path d='M6 8.5l4 4 4-4'/></svg>\")",
      backgroundPosition: 'right 10px center',
    }}
  >
    {children}
  </select>
)

/* ── Segmented control ──────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={cx(
        'inline-flex w-full gap-1 rounded-[var(--radius-sm)] bg-[var(--c-surface-2)] p-1',
        'border border-line',
      )}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative flex-1 rounded-[calc(var(--radius-sm)-4px)] font-medium transition-colors duration-200',
              size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-[14px]',
              on ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join('')}`}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-[calc(var(--radius-sm)-4px)] bg-surface shadow-[0_1px_3px_rgb(0_0_0_/_0.10)]"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Toggle ─────────────────────────────────────────────── */

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left py-1"
    >
      <span className="min-w-0">
        <span className="block text-[15px]">{label}</span>
        {description && <span className="block text-[12.5px] text-faint leading-snug">{description}</span>}
      </span>
      <span
        className={cx(
          'relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-250',
          checked ? 'bg-ok' : 'bg-[var(--c-line-strong)]',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 700, damping: 42 }}
          className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0_/_0.2)]"
          style={{ left: checked ? 22 : 2 }}
        />
      </span>
    </button>
  )
}

/* ── Misc ───────────────────────────────────────────────── */

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('border-0 border-t border-line', className)} />
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50',
        className,
      )}
    />
  )
}

export function EmptyState({
  icon = '🗂',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="text-[34px] leading-none opacity-60">{icon}</div>
      <h3 className="text-[16px] font-semibold">{title}</h3>
      {description && <p className="max-w-xs text-[13.5px] text-muted leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

export function KV({ k, v, className }: { k: string; v: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-baseline justify-between gap-4 py-2.5', className)}>
      <dt className="shrink-0 text-[13px] text-muted">{k}</dt>
      <dd className="text-right text-[14px] font-medium tabular">{v}</dd>
    </div>
  )
}

/** 充足率バー。数字より「あとどれだけ残っているか」が直感的に効く。 */
export function FillBar({ rate, tone = 'accent' }: { rate: number; tone?: 'accent' | 'ok' }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--c-line)]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.round(rate * 100))}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        className={cx('h-full rounded-full', tone === 'ok' ? 'bg-ok' : 'bg-accent')}
      />
    </div>
  )
}
