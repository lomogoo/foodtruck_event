import type { DataAdapter } from './db'
import type { EventDraft } from './types'

const SEED_FLAG = 'mk.seeded.v1'

const day = (offset: number, h = 10, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const base: Omit<EventDraft, 'title' | 'summary' | 'venue' | 'address' | 'startAt' | 'endAt' | 'fee' | 'capacity' | 'applicationDeadline' | 'expectedVisitors' | 'thumbnailUrl' | 'selectionMethod' | 'resultAnnounceAt'> = {
  openHours: '10:00 - 17:00',
  loadInTime: '当日 8:00 より',
  feeNote: '1台1日あたり・売上歩合なし',
  power: 'available',
  powerCapacityW: 1500,
  water: false,
  notes: 'ゴミは各自お持ち帰りをお願いします。雨天決行、荒天中止。',
  attachments: [],
  organizer: 'リバーサイド実行委員会',
  contactEmail: 'event@example.jp',
  cancellationPolicy: '開催7日前までのご連絡でキャンセル料はかかりません。',
  status: 'open',
}

/** グラデーションのSVGサムネ。外部画像に依存せずカードを成立させる。 */
const thumb = (a: string, b: string, emoji: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><text x="400" y="300" font-size="180" text-anchor="middle">${emoji}</text></svg>`,
  )}`

const SEEDS: EventDraft[] = [
  {
    ...base,
    title: '春の river side マルシェ 2026',
    summary: '河川敷の芝生広場で開催する2日間のマルシェ。ファミリー層が中心で、昼食帯の回転が非常に良いイベントです。昨年は2日間で約8,000人が来場しました。',
    venue: '市営河川敷公園 芝生広場',
    address: '東京都〇〇区河川敷1-1',
    startAt: day(18, 10),
    endAt: day(19, 17),
    fee: 15000,
    capacity: 8,
    selectionMethod: 'lottery',
    resultAnnounceAt: day(12, 18),
    applicationDeadline: day(9, 23, 59),
    expectedVisitors: 8000,
    thumbnailUrl: thumb('#FFB36B', '#FF5A24', '🌸'),
  },
  {
    ...base,
    title: '駅前ナイトフードフェス',
    summary: '金・土の夜に駅前広場で開催。仕事帰りの20〜30代がメイン層で、アルコールとの相性が良い業態は特に伸びます。照明・音響は主催者側で用意します。',
    venue: '〇〇駅前 ペデストリアンデッキ下広場',
    address: '東京都〇〇区駅前2-4',
    startAt: day(6, 16),
    endAt: day(7, 22),
    openHours: '16:00 - 22:00',
    fee: 12000,
    capacity: 5,
    selectionMethod: 'first_come',
    resultAnnounceAt: '',
    applicationDeadline: day(2, 23, 59),
    expectedVisitors: 4500,
    powerCapacityW: 2000,
    thumbnailUrl: thumb('#5B6CFF', '#1B1F3B', '🌃'),
  },
  {
    ...base,
    title: '企業フェス 社員向けランチ出店',
    summary: '大手企業の社内イベントに合わせたランチ出店。来場者は社員限定ですが、電子マネー利用率が高く客単価も安定。出店料は無料、売上歩合もありません。',
    venue: '〇〇テックパーク 中庭',
    address: '神奈川県〇〇市テックパーク1',
    startAt: day(31, 11),
    endAt: day(31, 14),
    openHours: '11:00 - 14:00',
    loadInTime: '当日 9:30 より',
    fee: 0,
    feeNote: '出店料・歩合ともになし（主催者負担）',
    capacity: 4,
    selectionMethod: 'lottery',
    resultAnnounceAt: day(23, 18),
    applicationDeadline: day(20, 23, 59),
    expectedVisitors: 1200,
    power: 'negotiable',
    powerCapacityW: 0,
    water: true,
    thumbnailUrl: thumb('#38D39F', '#0E6B52', '🏢'),
  },
  {
    ...base,
    title: '秋の収穫祭マーケット',
    summary: '地元農家の直売と併催する収穫祭。地場野菜を使ったメニューを出していただける店舗を優先的にご案内しています。',
    venue: '中央公園 イベント広場',
    address: '東京都〇〇区中央3-12',
    startAt: day(52, 9),
    endAt: day(52, 16),
    openHours: '9:00 - 16:00',
    fee: 10000,
    capacity: 10,
    selectionMethod: 'first_come',
    resultAnnounceAt: '',
    applicationDeadline: day(38, 23, 59),
    expectedVisitors: 3000,
    thumbnailUrl: thumb('#F6C453', '#C2410C', '🍂'),
  },
]

/** 初回起動時だけサンプルを投入する（ローカルモード専用）。 */
export async function seedIfEmpty(db: DataAdapter) {
  if (db.kind !== 'local') return
  if (localStorage.getItem(SEED_FLAG)) return
  const existing = await db.listEvents()
  if (existing.length === 0) {
    for (const s of SEEDS) await db.createEvent(s)
  }
  localStorage.setItem(SEED_FLAG, '1')
}
