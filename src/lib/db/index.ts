import { getConfig, isCloudMode } from '../config'
import { LocalAdapter } from './local'
import type { DataAdapter } from './types'

export type { DataAdapter } from './types'
export { uid } from './local'

let cached: DataAdapter | null = null
let cachedKey = ''

const keyOf = () => {
  const { supabaseUrl, supabaseAnonKey } = getConfig()
  return isCloudMode() ? `cloud:${supabaseUrl}:${supabaseAnonKey.slice(0, 12)}` : 'local'
}

/**
 * 設定に応じてバックエンドを返す。Supabase クライアントは接続設定がある時だけ
 * 動的に読み込むので、端末内モードのままなら初回転送量に乗らない。
 */
export async function loadDb(): Promise<DataAdapter> {
  const key = keyOf()
  if (cached && cachedKey === key) return cached
  if (isCloudMode()) {
    const { supabaseUrl, supabaseAnonKey } = getConfig()
    const { SupabaseAdapter } = await import('./supabase')
    cached = new SupabaseAdapter(supabaseUrl, supabaseAnonKey)
  } else {
    cached = new LocalAdapter()
  }
  cachedKey = key
  return cached
}
