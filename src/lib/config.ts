/**
 * 実行時設定。ビルド時の環境変数を基本にしつつ、管理画面から localStorage で
 * 上書きできるようにしてある（再ビルドなしで Supabase へ切り替えられる）。
 */
const LS_KEY = 'mk.runtime-config'

export interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  /** true の間は接続情報があっても端末内ストレージを使う（動作確認用）。 */
  useLocal: boolean
}

function readOverride(): Partial<RuntimeConfig> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<RuntimeConfig>
  } catch {
    return {}
  }
}

const env = import.meta.env

/**
 * 既定の接続先。publishable キーは公開前提のキーで、実際の保護は
 * Postgres 側の RLS が担うため、そのまま同梱してよい。
 */
const DEFAULT_SUPABASE_URL = 'https://tfkzsbwhvhgxbnnfwtou.supabase.co'
const DEFAULT_SUPABASE_KEY = 'sb_publishable_Ro1VwRK4o96IkyV6JC0q6w_vCjfFWYm'

export function getConfig(): RuntimeConfig {
  const o = readOverride()
  return {
    supabaseUrl: (o.supabaseUrl || env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim(),
    supabaseAnonKey: (o.supabaseAnonKey || env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY).trim(),
    useLocal: o.useLocal === true,
  }
}

export function setConfig(next: Partial<RuntimeConfig>) {
  localStorage.setItem(LS_KEY, JSON.stringify({ ...readOverride(), ...next }))
}

export function clearConfig() {
  localStorage.removeItem(LS_KEY)
}

export function isCloudMode(): boolean {
  const c = getConfig()
  return !c.useLocal && Boolean(c.supabaseUrl && c.supabaseAnonKey)
}

/**
 * 管理画面のパスコード。クラウドモードでは Supabase の RLS が本番の防壁で、
 * これは画面を隠すだけの簡易ゲート。
 */
export const ADMIN_PASSCODE = (env.VITE_ADMIN_PASSCODE || 'mk-admin').trim()
