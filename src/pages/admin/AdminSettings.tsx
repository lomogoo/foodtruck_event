import { useState } from 'react'
import { useToast } from '../../components/Toast'
import { Badge, Button, Card, Divider, Field, Input, Section } from '../../components/ui'
import { clearConfig, getConfig, setConfig } from '../../lib/config'
import { SUPABASE_SCHEMA_SQL } from '../../lib/schemaSql'
import { useStore } from '../../lib/store'

/** データの置き場所（端末内 or Supabase）を切り替える画面。 */
export function AdminSettings() {
  const { mode, events, applications } = useStore()
  const toast = useToast()
  const [cfg, setCfg] = useState(getConfig)

  const apply = () => {
    setConfig({ supabaseUrl: cfg.supabaseUrl.trim(), supabaseAnonKey: cfg.supabaseAnonKey.trim() })
    toast('保存しました。再読み込みします', 'ok')
    setTimeout(() => location.reload(), 600)
  }

  const reset = () => {
    clearConfig()
    toast('端末内データに戻します', 'ok')
    setTimeout(() => location.reload(), 600)
  }

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL)
      toast('SQLをコピーしました', 'ok')
    } catch {
      toast('コピーできませんでした', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Section title="データの保存先">
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Badge tone={mode === 'cloud' ? 'ok' : 'warn'}>
              {mode === 'cloud' ? 'Supabase（共有）' : '端末内（この端末のみ）'}
            </Badge>
            <span className="text-[12px] text-faint tabular">
              イベント{events.length}件 ・ 申込{applications.length}件
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-muted">
            {mode === 'cloud'
              ? 'Supabase に接続しています。イベントと申込は全員で共有されます。'
              : '現在はこの端末のブラウザ内にだけ保存されています。出店者の申込を主催者の端末で受け取るには、下の Supabase 設定を行ってください。'}
          </p>
        </Card>
      </Section>

      <Section title="Supabase に接続する" description="無料枠で運用できます。所要5分。">
        <Card className="space-y-4 p-4">
          <ol className="space-y-1.5 text-[13px] leading-relaxed text-muted">
            <li>1. supabase.com でプロジェクトを作成</li>
            <li>2. SQL Editor に下のSQLを貼り付けて実行（テーブルと権限が作られます）</li>
            <li>3. Project Settings → API の URL と anon key を下に貼り付け</li>
          </ol>
          <Button full onClick={copySql}>
            スキーマSQLをコピー
          </Button>
          <Divider />
          <Field label="Project URL">
            <Input
              value={cfg.supabaseUrl}
              onChange={(e) => setCfg({ ...cfg, supabaseUrl: e.target.value })}
              placeholder="https://xxxxxxxx.supabase.co"
              spellCheck={false}
            />
          </Field>
          <Field label="anon public key" hint="公開しても安全なキーです（RLSで保護されます）">
            <Input
              value={cfg.supabaseAnonKey}
              onChange={(e) => setCfg({ ...cfg, supabaseAnonKey: e.target.value })}
              placeholder="eyJhbGciOi..."
              spellCheck={false}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              accent
              full
              onClick={apply}
              disabled={!cfg.supabaseUrl.trim() || !cfg.supabaseAnonKey.trim()}
            >
              接続して再読み込み
            </Button>
            {mode === 'cloud' && (
              <Button onClick={reset} className="shrink-0">
                解除
              </Button>
            )}
          </div>
        </Card>
      </Section>

      <Section title="表示">
        <Card className="p-4">
          <ThemePicker />
        </Card>
      </Section>
    </div>
  )
}

const THEME_KEY = 'mk.theme'

function ThemePicker() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'system')
  const apply = (v: string) => {
    setTheme(v)
    localStorage.setItem(THEME_KEY, v)
    if (v === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', v)
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px]">外観</span>
      <div className="flex gap-1 rounded-[var(--radius-sm)] border border-line bg-[var(--c-surface-2)] p-1">
        {[
          { v: 'system', l: '自動' },
          { v: 'light', l: 'ライト' },
          { v: 'dark', l: 'ダーク' },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => apply(o.v)}
            className={[
              'rounded-[calc(var(--radius-sm)-4px)] px-3 py-1.5 text-[12.5px] font-medium transition-colors',
              theme === o.v ? 'bg-surface text-ink shadow-[0_1px_3px_rgb(0_0_0_/_0.1)]' : 'text-muted',
            ].join(' ')}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}
