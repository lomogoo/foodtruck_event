import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cx } from '../../components/ui'
import { Discover } from './Discover'
import { MyApplications } from './MyApplications'

type Tab = 'discover' | 'mine'

/** 出店者側の外枠。タブは2つだけに絞り、親指の届く位置に置く。 */
export function VendorShell() {
  const [tab, setTab] = useState<Tab>('discover')
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[100dvh] flex-col pad-safe-t">
      <div className="mx-auto w-full max-w-[560px] px-4 pt-2">
        <button
          onClick={() => navigate('/')}
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          ← トップ
        </button>
      </div>

      <main className="flex-1 pb-[92px]">
        {tab === 'discover' ? <Discover /> : <MyApplications />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line glass pad-safe-b">
        <div className="mx-auto flex max-w-[560px]">
          <TabButton active={tab === 'discover'} onClick={() => setTab('discover')} label="さがす">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.6-3.6" />
            </svg>
          </TabButton>
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} label="申込状況">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4h8a2 2 0 012 2v14l-6-3-6 3V6a2 2 0 012-2z" />
            </svg>
          </TabButton>
        </div>
      </nav>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors duration-200',
        active ? 'text-ink' : 'text-faint',
      )}
    >
      {children}
      <span className="text-[10.5px] font-medium">{label}</span>
      {active && (
        <motion.span
          layoutId="vendor-tab"
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="absolute inset-x-6 top-0 h-[2px] rounded-full bg-ink"
        />
      )}
    </button>
  )
}
