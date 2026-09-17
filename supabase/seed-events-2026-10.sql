-- ============================================================
-- イベント登録：マイナビレディース ホームゲーム ／ 西公園ファミリー向けイベント
-- Supabase の SQL Editor に貼り付けて実行してください。
--
-- ・時刻は JST（+09）表記。列は timestamptz なので UTC に正規化して保存されます。
-- ・同じタイトルのイベントが既にあれば挿入しません（再実行しても重複しません）。
-- ============================================================

with new_events (
  title, summary, venue, address,
  start_at, end_at,
  fee, fee_note,
  power, capacity, selection_method, application_deadline,
  cancellation_policy, notes
) as (
  values
  -- ── マイナビレディース ホームゲーム（3試合） ──────────────
  (
    'マイナビレディース ホームゲーム（10/18）',
    'ホームゲーム開催に合わせたキッチンカー出店です。試合前後の時間帯に来場者が集中します。',
    '', '',
    timestamptz '2026-10-18 10:00+09', timestamptz '2026-10-18 17:00+09',
    5000, '出店料5,000円。加えて売上の10%をロイヤリティとしてお支払いいただきます。',
    'none', 5, 'first_come', timestamptz '2026-10-11 23:59+09',
    '開催7日前までのご連絡でキャンセル料はかかりません。',
    '電源の供給はありません。発電機をご持参ください。開催時間・搬入時間は決まり次第ご案内します。'
  ),
  (
    'マイナビレディース ホームゲーム（10/24）',
    'ホームゲーム開催に合わせたキッチンカー出店です。試合前後の時間帯に来場者が集中します。',
    '', '',
    timestamptz '2026-10-24 10:00+09', timestamptz '2026-10-24 17:00+09',
    5000, '出店料5,000円。加えて売上の10%をロイヤリティとしてお支払いいただきます。',
    'none', 5, 'first_come', timestamptz '2026-10-17 23:59+09',
    '開催7日前までのご連絡でキャンセル料はかかりません。',
    '電源の供給はありません。発電機をご持参ください。開催時間・搬入時間は決まり次第ご案内します。'
  ),
  (
    'マイナビレディース ホームゲーム（11/7）',
    'ホームゲーム開催に合わせたキッチンカー出店です。試合前後の時間帯に来場者が集中します。',
    '', '',
    timestamptz '2026-11-07 10:00+09', timestamptz '2026-11-07 17:00+09',
    5000, '出店料5,000円。加えて売上の10%をロイヤリティとしてお支払いいただきます。',
    'none', 2, 'first_come', timestamptz '2026-10-31 23:59+09',
    '開催7日前までのご連絡でキャンセル料はかかりません。',
    '電源の供給はありません。発電機をご持参ください。募集は2台のみです。開催時間・搬入時間は決まり次第ご案内します。'
  ),
  -- ── 西公園 ファミリー向けイベント ─────────────────────────
  (
    '西公園 ファミリー向けイベント',
    'ファミリー層が中心の公園イベントです。出店料はかからず、主催者より出店保証をお支払いします。',
    '西公園', '',
    timestamptz '2026-10-31 10:00+09', timestamptz '2026-10-31 16:00+09',
    0, '出店料は無料です。さらに主催者より出店保証として10,000円をお支払いします。',
    'none', 0, 'first_come', timestamptz '2026-10-24 23:59+09',
    '開催7日前までのご連絡でキャンセル料はかかりません。',
    '電源の供給はありません。発電機をご持参ください。開催時間・搬入時間・募集台数は決まり次第ご案内します。'
  )
)
insert into public.ft_events (
  title, summary, venue, address,
  start_at, end_at,
  fee, fee_note,
  power, capacity, selection_method, application_deadline,
  cancellation_policy, notes,
  status
)
select
  n.title, n.summary, n.venue, n.address,
  n.start_at, n.end_at,
  n.fee, n.fee_note,
  n.power, n.capacity, n.selection_method, n.application_deadline,
  n.cancellation_policy, n.notes,
  'open'
from new_events n
where not exists (
  select 1 from public.ft_events e where e.title = n.title
);

-- 登録結果の確認
select
  title,
  to_char(start_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD(Dy)') as "開催日",
  fee                                                           as "出店料",
  capacity                                                      as "募集枠",
  selection_method                                              as "選考方法",
  power                                                         as "電源",
  to_char(application_deadline at time zone 'Asia/Tokyo', 'MM/DD') as "申込締切",
  status
from public.ft_events
where title like 'マイナビレディース%' or title = '西公園 ファミリー向けイベント'
order by start_at;
