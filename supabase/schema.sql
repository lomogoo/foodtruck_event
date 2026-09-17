-- ============================================================
-- キッチンカー出店プラットフォーム / Supabase スキーマ
-- SQL Editor に貼り付けてそのまま実行してください。
--
-- この Supabase プロジェクトは複数サイトで共有しているため、
-- このサイトのテーブル・バケットはすべて ft_ / ft- で始めます。
-- 他サイトのテーブル（kc_events など）には一切触れません。
-- ============================================================

create extension if not exists "pgcrypto";

-- ── イベント ────────────────────────────────────────────────
create table if not exists public.ft_events (
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
  selection_method    text        not null default 'first_come'
                        check (selection_method in ('first_come','lottery')),
  result_announce_at  timestamptz,
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

create index if not exists ft_events_start_at_idx on public.ft_events (start_at);
create index if not exists ft_events_status_idx   on public.ft_events (status);

-- 既に ft_events を作成済みのプロジェクト向け。再実行しても安全。
alter table public.ft_events
  add column if not exists selection_method text not null default 'first_come';
alter table public.ft_events
  add column if not exists result_announce_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.ft_events'::regclass
      and conname = 'ft_events_selection_method_check'
  ) then
    alter table public.ft_events
      add constraint ft_events_selection_method_check
      check (selection_method in ('first_come','lottery'));
  end if;
end $$;

-- ── 出店申込 ────────────────────────────────────────────────
create table if not exists public.ft_applications (
  id                         uuid primary key default gen_random_uuid(),
  event_id                   uuid not null references public.ft_events (id) on delete cascade,
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

create index if not exists ft_applications_event_id_idx on public.ft_applications (event_id);

-- ── 行レベルセキュリティ ────────────────────────────────────
-- 出店者はログイン不要（anon）。主催者は Supabase Auth のユーザーとして
-- ログインした場合のみ、編集・申込閲覧ができます。
alter table public.ft_events       enable row level security;
alter table public.ft_applications enable row level security;

-- ポリシーはロール単位（to anon / to authenticated）で分ける。
-- auth.role() のようなヘルパに依存せず、Postgres が直接判定する。
drop policy if exists "ft_events readable by everyone"        on public.ft_events;
drop policy if exists "ft_events readable by visitors"        on public.ft_events;
drop policy if exists "ft_events readable by admins"          on public.ft_events;
drop policy if exists "ft_events writable by admins"          on public.ft_events;
drop policy if exists "ft_applications insertable by all"     on public.ft_applications;
drop policy if exists "ft_applications insertable by visitors" on public.ft_applications;
drop policy if exists "ft_applications readable by admins"    on public.ft_applications;
drop policy if exists "ft_applications updatable by admins"   on public.ft_applications;
drop policy if exists "ft_applications deletable by admins"   on public.ft_applications;
drop policy if exists "ft_applications managed by admins"     on public.ft_applications;

-- 出店者（未ログイン）は、公開済みイベントだけ読める。下書きは見えない。
create policy "ft_events readable by visitors"
  on public.ft_events for select to anon
  using (status <> 'draft');

-- 主催者（ログイン済み）は下書きを含めてすべて読み書きできる。
create policy "ft_events readable by admins"
  on public.ft_events for select to authenticated
  using (true);

create policy "ft_events writable by admins"
  on public.ft_events for all to authenticated
  using (true) with check (true);

-- 出店者は申込を送れるだけ。送った内容を読み返すことはできない。
create policy "ft_applications insertable by visitors"
  on public.ft_applications for insert to anon
  with check (true);

-- 申込の閲覧・承認・削除は主催者だけ。
create policy "ft_applications managed by admins"
  on public.ft_applications for all to authenticated
  using (true) with check (true);

-- ── テーブル権限 ────────────────────────────────────────────
-- 行の可否は RLS が決めるが、操作そのものもロール単位で絞っておく。
grant usage on schema public to anon, authenticated;
grant select                         on public.ft_events       to anon;
grant select, insert, update, delete on public.ft_events       to authenticated;
grant insert                         on public.ft_applications to anon;
grant select, insert, update, delete on public.ft_applications to authenticated;

-- ── 申込数の公開ビュー ──────────────────────────────────────
-- 出店者は申込の中身を読めないが、「何台埋まっているか」は見えないと
-- 残枠も締切の判断もできない。件数だけを集計して公開する。
create or replace view public.ft_event_application_counts as
  select event_id, count(*)::int as applied
  from public.ft_applications
  where attendance = 'attend'
    and status in ('pending', 'approved')
  group by event_id;

grant select on public.ft_event_application_counts to anon, authenticated;

-- ── ストレージ（添付ファイル）────────────────────────────────
insert into storage.buckets (id, name, public)
values ('ft-attachments', 'ft-attachments', true)
on conflict (id) do nothing;

drop policy if exists "ft attachments readable"   on storage.objects;
drop policy if exists "ft attachments uploadable" on storage.objects;

create policy "ft attachments readable"
  on storage.objects for select
  using (bucket_id = 'ft-attachments');

create policy "ft attachments uploadable"
  on storage.objects for insert
  with check (bucket_id = 'ft-attachments');

-- ============================================================
-- 主催者アカウントの作り方:
--   Authentication → Users → Add user で、メールとパスワードを登録します。
--   そのメール／パスワードで管理者ページにログインしてください。
-- ============================================================
