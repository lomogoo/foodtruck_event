import { useState } from 'react'
import { useToast } from '../../components/Toast'
import { Badge, Button, Card, Divider, Field, Input, Section, Toggle } from '../../components/ui'
import { getConfig, setConfig } from '../../lib/config'
import { BUCKET, TABLE_PREFIX } from '../../lib/db/names'
import { SUPABASE_SCHEMA_SQL } from '../../lib/schemaSql'
import { useStore } from '../../lib/store'

/** 接続先と表示の設定。通常運用では触る必要がない。 */
export function AdminSettings() {
  const { mode, events, applications } = useStore()
  const toast = useToast()
  const [cfg, setCfg] = useState(getConfig)
  const [advanced, setAdvanced] = useState(false)

  const reload = (message: string) => {
    toast(message, 'ok')
    setTimeout(() => location.reload(), 600)
  }

  const apply = () => {
    setConfig({ supabaseUrl: cfg.supabaseUrl.trim(), supabaseAnonKey: cfg.supabaseAnonKey.trim() })
    reload('保存しました。再読み込みします')
  }

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL)
      toast('SQLをコピーしました', 'ok')
    } catch {
      toast('コピーできませんでした', 'error')
    }
  }

  const host = (() => {
    try {
      return new URL(cfg.supabaseUrl).hostname
    } catch {
      return cfg.supabaseUrl
    }
  })()

  return (
    <div className="space-y-6">
      <Section title="データの保存先">
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={mode === 'cloud' ? 'ok' : 'warn'}>
              {mode === 'cloud' ? 'Supabase（共有）' : '端末内（この端末のみ）'}
            </Badge>
            <span className="text-[12px] text-faint tabular">
              イベント{events.length}件 ・ 申込{applications.length}件
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-muted">
            {mode === 'cloud' ? (
              <>
                <span className="font-medium text-ink">{host}</span> に接続しています。
                イベントと申込は全員で共有され、どの端末からでも同じ内容が見えます。
              </>
            ) : (
              'この端末のブラウザ内にだけ保存されています。動作確認用のモードです。'
            )}
          </p>
          <dl className="divide-y divide-[var(--c-line)] border-t border-line pt-1 text-[13px]">
            <div className="flex justify-between py-2">
              <dt className="text-muted">テーブル</dt>
              <dd className="font-medium">{TABLE_PREFIX}events / {TABLE_PREFIX}applications</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted">ファイル</dt>
              <dd className="font-medium">{BUCKET}</dd>
            </div>
          </dl>
          <p className="text-[12px] leading-relaxed text-faint">
            この Supabase プロジェクトは他サイトと共用しているため、当サイトのテーブルとバケットは
            すべて <code className="font-semibold">ft_</code> / <code className="font-semibold">ft-</code> で始めています。
          </p>
        </Card>
      </Section>

      <Section title="表示">
        <Card className="p-4">
          <ThemePicker />
        </Card>
      </Section>

      <Section title="詳細設定" description="通常は変更不要です">
        <Card className="space-y-4 p-4">
          <Toggle
            checked={advanced}
            onChange={setAdvanced}
            label="詳細設定を表示"
            description="接続先の変更、スキーマSQLの取得"
          />

          {advanced && (
            <>
              <Divider />

              <div className="space-y-2">
                <p className="text-[13px] font-medium">スキーマの適用</p>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  Supabase の SQL Editor に貼り付けて実行すると、テーブル・インデックス・RLSポリシー・
                  ストレージバケットが作られます。既存のテーブルには影響しません。
                </p>
                <Button full onClick={copySql}>
                  スキーマSQLをコピー
                </Button>
              </div>

              <Divider />

              <Field label="Project URL">
                <Input
                  value={cfg.supabaseUrl}
                  onChange={(e) => setCfg({ ...cfg, supabaseUrl: e.target.value })}
                  placeholder="https://xxxxxxxx.supabase.co"
                  spellCheck={false}
                />
              </Field>
              <Field label="publishable key" hint="公開しても安全なキーです（RLSで保護されます）">
                <Input
                  value={cfg.supabaseAnonKey}
                  onChange={(e) => setCfg({ ...cfg, supabaseAnonKey: e.target.value })}
                  placeholder="sb_publishable_..."
                  spellCheck={false}
                />
              </Field>
              <Button accent full onClick={apply}>
                接続先を保存して再読み込み
              </Button>

              <Divider />

              <Toggle
                checked={cfg.useLocal}
                onChange={(v) => {
                  setCfg({ ...cfg, useLocal: v })
                  setConfig({ useLocal: v })
                  reload(v ? '端末内モードに切り替えます' : 'Supabase に接続します')
                }}
                label="端末内モードで動かす"
                description="Supabase に書き込まずに操作を試したいとき用"
              />
            </>
          )}
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
