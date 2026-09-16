/** Supabase の SQL Editor にそのまま貼れるスキーマ定義。 */
export const SUPABASE_SCHEMA_SQL = `-- ============================================================
-- キッチンカー出店プラットフォーム / Supabase スキーマ
-- SQL Editor に貼り付けてそのまま実行してください。
-- ============================================================

create extension if not exists "pgcrypto";

-- ── イベント ────────────────────────────────────────────────
create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  title               text        not null default '',
  summary             text        not null default '',
  venue               text        not null default '',
  address             text        not null default '',
  start_at            timestamptz,
  end_at              timestamptz,
  open_hours          text        not null default '',
  load_in_time        text        not null default '',
  fee                 integer     not null default 0,
  fee_note            text        not null default '',
  power               text        not null default 'none'
                        check (power in ('none','available','negotiable')),
  power_capacity_w    integer     not null default 0,
  water               boolean     not null default false,
  notes               text        not null default '',
  thumbnail_url       text        not null default '',
  attachments         jsonb       not null default '[]'::jsonb,
  capacity            integer     not null default 0,
  application_deadline timestamptz,
  expected_visitors   integer     not null default 0,
  organizer           text        not null default '',
  contact_email       text        not null default '',
  cancellation_policy text        not null default '',
  status              text        not null default 'draft'
                        check (status in ('draft','open','closed')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists events_start_at_idx on public.events (start_at);
create index if not exists events_status_idx   on public.events (status);

-- ── 出店申込 ────────────────────────────────────────────────
create table if not exists public.applications (
  id                         uuid primary key default gen_random_uuid(),
  event_id                   uuid not null references public.events (id) on delete cascade,
  attendance                 text not null default 'attend'
                               check (attendance in ('attend','decline')),
  status                     text not null default 'pending'
                               check (status in ('pending','approved','rejected','withdrawn')),
  shop_name                  text not null default '',
  rep_name                   text not null default '',
  email                      text not null default '',
  phone                      text not null default '',
  fire_source                text not null default 'none'
                               check (fire_source in ('none','gas','charcoal','both')),
  gas_kind                   text check (gas_kind in ('propane','cassette','other')),
  gas_kind_other             text not null default '',
  gas_cylinder_count         integer not null default 0,
  gas_cylinder_size          text not null default '',
  charcoal_extinguish_method text not null default '',
  fire_extinguisher_count    integer not null default 0,
  appliances                 jsonb not null default '[]'::jsonb,
  brings_generator           boolean not null default false,
  generator_note             text not null default '',
  menu                       jsonb not null default '[]'::jsonb,
  food_license_number        text not null default '',
  has_insurance              boolean not null default false,
  truck_size                 jsonb not null default '{}'::jsonb,
  vehicle_number             text not null default '',
  files                      jsonb not null default '[]'::jsonb,
  notes                      text not null default '',
  decline_reason             text not null default '',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists applications_event_id_idx on public.applications (event_id);

-- ── 行レベルセキュリティ ────────────────────────────────────
-- 出店者はログイン不要（anon）。主催者は Supabase Auth のユーザーとして
-- ログインした場合のみ、編集・申込閲覧ができます。
alter table public.events       enable row level security;
alter table public.applications enable row level security;

drop policy if exists "events readable by everyone"   on public.events;
drop policy if exists "events writable by admins"     on public.events;
drop policy if exists "applications insertable by all" on public.applications;
drop policy if exists "applications managed by admins" on public.applications;

-- 公開済みイベントは誰でも読める（下書きは管理者のみ）。
create policy "events readable by everyone"
  on public.events for select
  using (status <> 'draft' or auth.role() = 'authenticated');

-- 作成・編集・削除はログイン済みの主催者だけ。
create policy "events writable by admins"
  on public.events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 申込は誰でも送れる。
create policy "applications insertable by all"
  on public.applications for insert
  with check (true);

-- 申込の閲覧・更新・削除はログイン済みの主催者だけ。
create policy "applications managed by admins"
  on public.applications for select using (auth.role() = 'authenticated');
create policy "applications updatable by admins"
  on public.applications for update using (auth.role() = 'authenticated');
create policy "applications deletable by admins"
  on public.applications for delete using (auth.role() = 'authenticated');

-- ── ストレージ（添付ファイル）────────────────────────────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments readable" on storage.objects;
drop policy if exists "attachments uploadable" on storage.objects;

create policy "attachments readable"
  on storage.objects for select
  using (bucket_id = 'attachments');

create policy "attachments uploadable"
  on storage.objects for insert
  with check (bucket_id = 'attachments');

-- ============================================================
-- 主催者アカウントの作り方:
--   Authentication → Users → Add user で、メールとパスワードを登録します。
--   そのメール／パスワードで管理者ページにログインしてください。
-- ============================================================
`
