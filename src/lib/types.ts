/** 共有ドメインモデル。ローカル(IndexedDB)/Supabase 両アダプタが同じ形を返す。 */

export type EventStatus = 'draft' | 'open' | 'closed'
export type PowerAvailability = 'none' | 'available' | 'negotiable'
/** 枠の埋め方。先着は埋まり次第締切、抽選は締切まで受け付けて後から選ぶ。 */
export type SelectionMethod = 'first_come' | 'lottery'

export interface Attachment {
  id: string
  name: string
  mime: string
  size: number
  /** Supabase Storage の公開URL、またはローカル保存キー (`local:<id>`)。 */
  url: string
}

export interface EventRecord {
  id: string
  title: string
  summary: string
  venue: string
  address: string
  /** ISO 8601。startAt/endAt は開催日時（複数日開催は endAt を最終日に）。 */
  startAt: string
  endAt: string
  /** 「10:00-17:00」のような営業時間表記。日時とは別に出店者が最も気にする情報。 */
  openHours: string
  /** 搬入開始時刻。 */
  loadInTime: string
  /** 出店料（円）。0 は無料。 */
  fee: number
  feeNote: string
  power: PowerAvailability
  /** 1区画あたりの供給可能容量(W)。0 は未定。 */
  powerCapacityW: number
  water: boolean
  notes: string
  thumbnailUrl: string
  attachments: Attachment[]
  /** 募集枠数（出店できる台数）。0 は未定。 */
  capacity: number
  /** 先着順か抽選か。残枠の意味と締切の挙動が変わる。 */
  selectionMethod: SelectionMethod
  /** 抽選結果の通知予定日 ISO 8601。抽選のときだけ意味を持つ。 */
  resultAnnounceAt: string
  /** 申込締切 ISO 8601。 */
  applicationDeadline: string
  /** 想定来場者数。出店判断で最も効く数字なので必須級に扱う。 */
  expectedVisitors: number
  /** 主催者名・連絡先。 */
  organizer: string
  contactEmail: string
  /** キャンセル可能期限の説明（リスク低減表示に使う）。 */
  cancellationPolicy: string
  status: EventStatus
  createdAt: string
  updatedAt: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
/** 出店可否。'decline' は「今回は見送り」を記録したもの。 */
export type Attendance = 'attend' | 'decline'

export type FireSource = 'none' | 'gas' | 'charcoal' | 'both'
export type GasKind = 'propane' | 'cassette' | 'other'

export interface Appliance {
  id: string
  name: string
  /** 消費電力(W)。 */
  watt: number
  qty: number
}

export interface MenuItem {
  id: string
  name: string
  price: number
}

export interface TruckSize {
  /** ミリメートル。 */
  length: number
  width: number
  height: number
  /** 販売時に張り出すオーニング等を含めた展開時の全長・全幅。 */
  expandedLength: number
  expandedWidth: number
}

export interface ApplicationRecord {
  id: string
  eventId: string
  attendance: Attendance
  status: ApplicationStatus

  shopName: string
  repName: string
  email: string
  phone: string

  fireSource: FireSource
  gasKind: GasKind | null
  gasKindOther: string
  /** ガスボンベ本数。 */
  gasCylinderCount: number
  /** 1本あたりの容量表記（例: 8kg / 250g）。 */
  gasCylinderSize: string
  /** 炭の場合の消火方法。 */
  charcoalExtinguishMethod: string
  /** 消火器の携行本数。消防提出で必ず問われる。 */
  fireExtinguisherCount: number

  appliances: Appliance[]
  /** 発電機を持ち込むか。 */
  bringsGenerator: boolean
  generatorNote: string

  menu: MenuItem[]
  /** 食品営業許可の種別・番号。 */
  foodLicenseNumber: string
  /** PL保険（生産物賠償責任保険）加入有無。 */
  hasInsurance: boolean

  truckSize: TruckSize
  vehicleNumber: string

  files: Attachment[]
  notes: string
  /** 見送り時の理由（任意）。次回の案内改善に使う。 */
  declineReason: string

  createdAt: string
  updatedAt: string
}

export type EventDraft = Omit<EventRecord, 'id' | 'createdAt' | 'updatedAt'>
export type ApplicationDraft = Omit<ApplicationRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'>
