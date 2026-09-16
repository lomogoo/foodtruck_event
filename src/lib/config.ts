/**
 * 実行時設定。ビルド時の環境変数を基本にしつつ、管理画面から localStorage で
 * 上書きできるようにしてある（再ビルドなしで Supabase へ切り替えられる）。
 */
const LS_KEY = 'mk.runtime-config'

export interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

function readOverride(): Partial<RuntimeConfig> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<RuntimeConfig>
  } catch {
    return {}
  }
}

const env = import.meta.env

export function getConfig(): RuntimeConfig {
  const o = readOverride()
  return {
    supabaseUrl: (o.supabaseUrl || env.VITE_SUPABASE_URL || '').trim(),
    supabaseAnonKey: (o.supabaseAnonKey || env.VITE_SUPABASE_ANON_KEY || '').trim(),
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
  return Boolean(c.supabaseUrl && c.supabaseAnonKey)
}

/**
 * 管理画面のパスコード。クラウドモードでは Supabase の RLS が本番の防壁で、
 * これは画面を隠すだけの簡易ゲート。
 */
export const ADMIN_PASSCODE = (env.VITE_ADMIN_PASSCODE || 'mk-admin').trim()
