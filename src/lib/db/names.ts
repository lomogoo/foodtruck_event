/**
 * この Supabase プロジェクトは複数サイトで共有しているため、
 * このサイトの資産はすべて `ft_` / `ft-`（food truck）で始める。
 * 他サイトのテーブル（kc_events など）とは名前空間で分離される。
 */
export const TABLE_PREFIX = 'ft_'
export const T_EVENTS = `${TABLE_PREFIX}events`
export const T_APPLICATIONS = `${TABLE_PREFIX}applications`
export const V_APPLICATION_COUNTS = `${TABLE_PREFIX}event_application_counts`
export const BUCKET = 'ft-attachments'
