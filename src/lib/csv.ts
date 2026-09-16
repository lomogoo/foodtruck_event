import { APP_STATUS_LABEL, FIRE_LABEL, GAS_LABEL, totalWatt } from './format'
import type { ApplicationRecord, EventRecord } from './types'

const esc = (v: unknown) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const HEADERS = [
  'イベント', '申込日時', 'ステータス', '出店可否', '店舗名', '代表者名', 'メール', '電話番号',
  '火気', 'ガス種別', 'ボンベ本数', 'ボンベ容量', '炭の消火方法', '消火器本数',
  '電気機器', '合計消費電力(W)', '発電機', '提供メニュー', '営業許可番号', 'PL保険',
  '全長(mm)', '全幅(mm)', '全高(mm)', '展開時全長(mm)', '展開時全幅(mm)', '車両ナンバー',
  '添付ファイル', '備考',
]

/** 消防提出・主催者の台帳作成にそのまま使える行を吐く。 */
export function applicationsToCsv(apps: ApplicationRecord[], events: EventRecord[]): string {
  const title = (id: string) => events.find((e) => e.id === id)?.title ?? '(削除済み)'
  const rows = apps.map((a) =>
    [
      title(a.eventId),
      a.createdAt,
      APP_STATUS_LABEL[a.status],
      a.attendance === 'attend' ? '出店する' : '見送り',
      a.shopName, a.repName, a.email, a.phone,
      FIRE_LABEL[a.fireSource],
      a.gasKind ? (a.gasKind === 'other' ? a.gasKindOther : GAS_LABEL[a.gasKind]) : '',
      a.gasCylinderCount || '',
      a.gasCylinderSize,
      a.charcoalExtinguishMethod,
      a.fireExtinguisherCount || '',
      a.appliances.map((x) => `${x.name} ${x.watt}W×${x.qty}`).join(' / '),
      totalWatt(a),
      a.bringsGenerator ? `あり${a.generatorNote ? `（${a.generatorNote}）` : ''}` : 'なし',
      a.menu.map((m) => `${m.name}${m.price ? ` ¥${m.price}` : ''}`).join(' / '),
      a.foodLicenseNumber,
      a.hasInsurance ? '加入' : '未加入',
      a.truckSize.length, a.truckSize.width, a.truckSize.height,
      a.truckSize.expandedLength, a.truckSize.expandedWidth,
      a.vehicleNumber,
      a.files.map((f) => f.name).join(' / '),
      a.notes.replace(/\n/g, ' '),
    ].map(esc).join(','),
  )
  return [HEADERS.join(','), ...rows].join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  // Excel が UTF-8 と認識できるよう BOM を付ける。
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
