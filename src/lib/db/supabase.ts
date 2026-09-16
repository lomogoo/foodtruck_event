import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  ApplicationDraft,
  ApplicationRecord,
  ApplicationStatus,
  Attachment,
  EventDraft,
  EventRecord,
} from '../types'
import type { DataAdapter } from './types'

const BUCKET = 'attachments'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

const eventToRow = (e: Partial<EventDraft>): Row => {
  const r: Row = {}
  const set = <K extends keyof EventDraft>(k: K, col: string) => {
    if (e[k] !== undefined) r[col] = e[k]
  }
  set('title', 'title'); set('summary', 'summary'); set('venue', 'venue')
  set('address', 'address'); set('startAt', 'start_at'); set('endAt', 'end_at')
  set('openHours', 'open_hours'); set('loadInTime', 'load_in_time')
  set('fee', 'fee'); set('feeNote', 'fee_note'); set('power', 'power')
  set('powerCapacityW', 'power_capacity_w'); set('water', 'water'); set('notes', 'notes')
  set('thumbnailUrl', 'thumbnail_url'); set('attachments', 'attachments')
  set('capacity', 'capacity'); set('applicationDeadline', 'application_deadline')
  set('expectedVisitors', 'expected_visitors'); set('organizer', 'organizer')
  set('contactEmail', 'contact_email'); set('cancellationPolicy', 'cancellation_policy')
  set('status', 'status')
  return r
}

const rowToEvent = (r: Row): EventRecord => ({
  id: r.id,
  title: r.title ?? '',
  summary: r.summary ?? '',
  venue: r.venue ?? '',
  address: r.address ?? '',
  startAt: r.start_at ?? '',
  endAt: r.end_at ?? '',
  openHours: r.open_hours ?? '',
  loadInTime: r.load_in_time ?? '',
  fee: r.fee ?? 0,
  feeNote: r.fee_note ?? '',
  power: r.power ?? 'none',
  powerCapacityW: r.power_capacity_w ?? 0,
  water: r.water ?? false,
  notes: r.notes ?? '',
  thumbnailUrl: r.thumbnail_url ?? '',
  attachments: r.attachments ?? [],
  capacity: r.capacity ?? 0,
  applicationDeadline: r.application_deadline ?? '',
  expectedVisitors: r.expected_visitors ?? 0,
  organizer: r.organizer ?? '',
  contactEmail: r.contact_email ?? '',
  cancellationPolicy: r.cancellation_policy ?? '',
  status: r.status ?? 'draft',
  createdAt: r.created_at ?? '',
  updatedAt: r.updated_at ?? '',
})

const applicationToRow = (a: ApplicationDraft): Row => ({
  event_id: a.eventId,
  attendance: a.attendance,
  shop_name: a.shopName,
  rep_name: a.repName,
  email: a.email,
  phone: a.phone,
  fire_source: a.fireSource,
  gas_kind: a.gasKind,
  gas_kind_other: a.gasKindOther,
  gas_cylinder_count: a.gasCylinderCount,
  gas_cylinder_size: a.gasCylinderSize,
  charcoal_extinguish_method: a.charcoalExtinguishMethod,
  fire_extinguisher_count: a.fireExtinguisherCount,
  appliances: a.appliances,
  brings_generator: a.bringsGenerator,
  generator_note: a.generatorNote,
  menu: a.menu,
  food_license_number: a.foodLicenseNumber,
  has_insurance: a.hasInsurance,
  truck_size: a.truckSize,
  vehicle_number: a.vehicleNumber,
  files: a.files,
  notes: a.notes,
  decline_reason: a.declineReason,
})

const rowToApplication = (r: Row): ApplicationRecord => ({
  id: r.id,
  eventId: r.event_id,
  attendance: r.attendance ?? 'attend',
  status: r.status ?? 'pending',
  shopName: r.shop_name ?? '',
  repName: r.rep_name ?? '',
  email: r.email ?? '',
  phone: r.phone ?? '',
  fireSource: r.fire_source ?? 'none',
  gasKind: r.gas_kind ?? null,
  gasKindOther: r.gas_kind_other ?? '',
  gasCylinderCount: r.gas_cylinder_count ?? 0,
  gasCylinderSize: r.gas_cylinder_size ?? '',
  charcoalExtinguishMethod: r.charcoal_extinguish_method ?? '',
  fireExtinguisherCount: r.fire_extinguisher_count ?? 0,
  appliances: r.appliances ?? [],
  bringsGenerator: r.brings_generator ?? false,
  generatorNote: r.generator_note ?? '',
  menu: r.menu ?? [],
  foodLicenseNumber: r.food_license_number ?? '',
  hasInsurance: r.has_insurance ?? false,
  truckSize: r.truck_size ?? { length: 0, width: 0, height: 0, expandedLength: 0, expandedWidth: 0 },
  vehicleNumber: r.vehicle_number ?? '',
  files: r.files ?? [],
  notes: r.notes ?? '',
  declineReason: r.decline_reason ?? '',
  createdAt: r.created_at ?? '',
  updatedAt: r.updated_at ?? '',
})

/** Supabase(Postgres + Storage) を使う共有バックエンド。 */
export class SupabaseAdapter implements DataAdapter {
  readonly kind = 'cloud' as const
  readonly adminNeedsEmail = true
  readonly client: SupabaseClient

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey)
  }

  private unwrap<T>(res: { data: unknown; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message)
    return res.data as T
  }

  async listEvents(): Promise<EventRecord[]> {
    const data = this.unwrap<Row[]>(
      await this.client.from('events').select('*').order('start_at', { ascending: true }),
    )
    return data.map(rowToEvent)
  }

  async getEvent(id: string) {
    const { data, error } = await this.client.from('events').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToEvent(data as Row) : null
  }

  async createEvent(draft: EventDraft) {
    const data = this.unwrap<Row>(
      await this.client.from('events').insert(eventToRow(draft)).select().single(),
    )
    return rowToEvent(data)
  }

  async updateEvent(id: string, patch: Partial<EventDraft>) {
    const data = this.unwrap<Row>(
      await this.client
        .from('events')
        .update({ ...eventToRow(patch), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
    )
    return rowToEvent(data)
  }

  async deleteEvent(id: string) {
    const { error } = await this.client.from('events').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async listApplications(eventId?: string): Promise<ApplicationRecord[]> {
    let q = this.client.from('applications').select('*').order('created_at', { ascending: false })
    if (eventId) q = q.eq('event_id', eventId)
    const data = this.unwrap<Row[]>(await q)
    return data.map(rowToApplication)
  }

  async createApplication(draft: ApplicationDraft) {
    const data = this.unwrap<Row>(
      await this.client.from('applications').insert(applicationToRow(draft)).select().single(),
    )
    return rowToApplication(data)
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus) {
    const data = this.unwrap<Row>(
      await this.client
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
    )
    return rowToApplication(data)
  }

  async deleteApplication(id: string) {
    const { error } = await this.client.from('applications').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async uploadFile(file: File): Promise<Attachment> {
    const safe = file.name.replace(/[^\w.\-]/g, '_')
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safe}`
    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
    if (error) throw new Error(`アップロードに失敗しました: ${error.message}`)
    const { data } = this.client.storage.from(BUCKET).getPublicUrl(path)
    return {
      id: path,
      name: file.name,
      mime: file.type,
      size: file.size,
      url: data.publicUrl,
    }
  }

  async resolveUrl(attachment: Attachment) {
    return attachment.url
  }

  async adminSignIn({ email, password }: { email: string; password: string }) {
    const { error } = await this.client.auth.signInWithPassword({ email, password })
    if (error) throw new Error('メールアドレスまたはパスワードが違います')
  }

  async adminSignOut() {
    await this.client.auth.signOut()
  }

  async isAdmin() {
    const { data } = await this.client.auth.getSession()
    return Boolean(data.session)
  }
}
