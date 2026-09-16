import type { ApplicationDraft } from './types'

const PROFILE_KEY = 'mk.vendor-profile'
const HANDLED_KEY = 'mk.handled'

/** 毎回同じことを書かせないための、端末に残す店舗プロフィール。 */
export type VendorProfile = Pick<
  ApplicationDraft,
  | 'shopName' | 'repName' | 'email' | 'phone'
  | 'fireSource' | 'gasKind' | 'gasKindOther' | 'gasCylinderCount' | 'gasCylinderSize'
  | 'charcoalExtinguishMethod' | 'fireExtinguisherCount'
  | 'appliances' | 'bringsGenerator' | 'generatorNote'
  | 'menu' | 'foodLicenseNumber' | 'hasInsurance'
  | 'truckSize' | 'vehicleNumber'
>

export function loadProfile(): Partial<VendorProfile> {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}') as Partial<VendorProfile>
  } catch {
    return {}
  }
}

export function saveProfile(p: VendorProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
  } catch {
    // ストレージ不可（プライベートモード等）でも申込自体は通す。
  }
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}

export type Handled = Record<string, 'attend' | 'decline'>

/** この端末がどのイベントに回答済みかの記録。デッキの再表示を防ぐ。 */
export function loadHandled(): Handled {
  try {
    return JSON.parse(localStorage.getItem(HANDLED_KEY) ?? '{}') as Handled
  } catch {
    return {}
  }
}

export function markHandled(eventId: string, value: 'attend' | 'decline') {
  const h = loadHandled()
  h[eventId] = value
  try {
    localStorage.setItem(HANDLED_KEY, JSON.stringify(h))
  } catch {
    /* noop */
  }
}

export function unmarkHandled(eventId: string) {
  const h = loadHandled()
  delete h[eventId]
  try {
    localStorage.setItem(HANDLED_KEY, JSON.stringify(h))
  } catch {
    /* noop */
  }
}
