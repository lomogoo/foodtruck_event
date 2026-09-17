// スキーマの実体は supabase/schema.sql。SQL Editor に貼る内容と、
// 設定画面の「コピー」が同じものを指すよう1ファイルに寄せている。
import sql from '../../supabase/schema.sql?raw'

export const SUPABASE_SCHEMA_SQL = sql
