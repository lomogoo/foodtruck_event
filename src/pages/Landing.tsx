import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon, ClipboardIcon, TruckIcon } from '../components/icons'
import { Badge } from '../components/ui'
import { useStore } from '../lib/store'

/** 最初の分岐。役割を選ぶだけの画面なので、要素は徹底的に削る。 */
export function Landing() {
  const navigate = useNavigate()
  const { events, statsFor } = useStore()
  const openCount = events.filter((e) => e.status === 'open' && !statsFor(e).closed).length

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col justify-center gap-10 px-6 py-12">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="space-y-3 text-center"
      >
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight">
          出店を、
          <br />
          その場で決める。
        </h1>
        <p className="mx-auto max-w-[19rem] text-[14px] leading-relaxed text-muted">
          キッチンカーの出店募集と申込を、ひとつの画面に。
          スワイプで探して、そのまま申し込めます。
        </p>
        {openCount > 0 && (
          <div className="flex justify-center pt-1">
            <Badge tone="accent">現在 {openCount} 件が募集中</Badge>
          </div>
        )}
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
        className="space-y-3"
      >
        <RoleCard
          icon={<TruckIcon size={24} />}
          title="出店者として使う"
          description="募集中のイベントを見て、その場で申し込む"
          cta="イベントをさがす"
          accent
          onClick={() => navigate('/vendor')}
        />
        <RoleCard
          icon={<ClipboardIcon size={24} />}
          title="主催者として使う"
          description="イベントの公開・編集、出店者の確認、案内メールの作成"
          cta="管理画面へ"
          onClick={() => navigate('/admin')}
        />
      </motion.div>

      <p className="text-center text-[11.5px] leading-relaxed text-faint">
        ログイン不要で出店申込ができます。主催者のみログインが必要です。
      </p>
    </div>
  )
}

function RoleCard({
  icon,
  title,
  description,
  cta,
  onClick,
  accent,
}: {
  icon: React.ReactNode
  title: string
  description: string
  cta: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={[
        'block w-full rounded-[var(--radius-lg)] border p-5 text-left transition-colors duration-200',
        accent
          ? 'border-transparent bg-ink text-[var(--c-surface)]'
          : 'border-line bg-surface hover:border-line-strong',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        <span className={accent ? 'mt-0.5 opacity-80' : 'mt-0.5 text-muted'}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold tracking-tight">{title}</span>
          <span className={['mt-1 block text-[13px] leading-relaxed', accent ? 'opacity-70' : 'text-muted'].join(' ')}>
            {description}
          </span>
          <span className={['mt-3 flex items-center gap-1 text-[13px] font-medium', accent ? '' : 'text-accent'].join(' ')}>
            {cta}
            <ChevronRightIcon size={15} />
          </span>
        </span>
      </div>
    </motion.button>
  )
}
