import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import { Button, Card, Field, Input, Segmented, Spinner } from '../../components/ui'
import { useStore } from '../../lib/store'
import { AdminApplications } from './AdminApplications'
import { AdminEvents } from './AdminEvents'
import { AdminSettings } from './AdminSettings'
import { MailComposer } from './MailComposer'

type Tab = 'events' | 'applications' | 'mail' | 'settings'

/** 管理者エリアの外枠。ログインを通すと4つのタブが開く。 */
export function Admin() {
  const { db, refresh } = useStore()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('events')
  const [scopeEvent, setScopeEvent] = useState('all')

  useEffect(() => {
    if (!db) return
    // 確認に失敗したら未ログイン扱いにする。ここで止まると画面が出ない。
    db.isAdmin().then(setAuthed, () => setAuthed(false))
  }, [db])

  if (!db || authed === null) {
    return (
      <div className="grid h-[70dvh] place-items-center text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!authed) {
    return (
      <SignIn
        onDone={async () => {
          await refresh()
          setAuthed(true)
        }}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-4 px-4 pb-10">
      <header className="flex items-end justify-between px-1 pt-2">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">管理</h1>
          <p className="text-[13px] text-muted">イベントと出店者の管理</p>
        </div>
        <button
          onClick={async () => {
            await db.adminSignOut()
            setAuthed(false)
          }}
          className="pb-1 text-[13px] text-muted hover:text-ink"
        >
          ログアウト
        </button>
      </header>

      <Segmented
        value={tab}
        onChange={(t) => setTab(t)}
        options={[
          { value: 'events', label: 'イベント' },
          { value: 'applications', label: '出店者' },
          { value: 'mail', label: 'メール' },
          { value: 'settings', label: '設定' },
        ]}
        size="sm"
      />

      {tab === 'events' && (
        <AdminEvents
          onOpenApplicants={(id) => {
            setScopeEvent(id)
            setTab('applications')
          }}
        />
      )}
      {tab === 'applications' && (
        <AdminApplications eventId={scopeEvent} onChangeEvent={setScopeEvent} />
      )}
      {tab === 'mail' && <MailComposer />}
      {tab === 'settings' && <AdminSettings />}
    </div>
  )
}

function SignIn({ onDone }: { onDone: () => void }) {
  const { db } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!db) return
    setBusy(true)
    try {
      await db.adminSignIn({ email: email.trim(), password })
      onDone()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ログインできませんでした', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-[400px] flex-col justify-center px-4">
      <Card className="space-y-5 p-6">
        <div className="space-y-1">
          <h1 className="text-[22px] font-semibold tracking-tight">管理者ログイン</h1>
          <p className="text-[13px] text-muted">
            {db?.adminNeedsEmail
              ? 'Supabase に登録した主催者アカウントでログインしてください。'
              : 'パスコードを入力してください。'}
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          {db?.adminNeedsEmail && (
            <Field label="メールアドレス">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.jp"
                autoComplete="username"
              />
            </Field>
          )}
          <Field label={db?.adminNeedsEmail ? 'パスワード' : 'パスコード'}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <Button accent full size="lg" type="submit" disabled={busy || !password}>
            {busy ? <Spinner /> : 'ログイン'}
          </Button>
        </form>

        {!db?.adminNeedsEmail && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--c-surface-2)] p-3 text-[12px] leading-relaxed text-muted">
            デモのパスコードは <code className="font-semibold">mk-admin</code> です。
            本番運用では設定タブから Supabase に接続し、主催者アカウントでのログインに切り替えてください。
          </p>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-[13px] text-muted hover:text-ink"
        >
          トップに戻る
        </button>
      </Card>
    </div>
  )
}
