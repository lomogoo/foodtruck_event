import { openDB, type IDBPDatabase } from 'idb'
import type {
  ApplicationDraft,
  ApplicationRecord,
  ApplicationStatus,
  Attachment,
  EventDraft,
  EventRecord,
} from '../types'
import { ADMIN_PASSCODE } from '../config'
import type { DataAdapter } from './types'

const DB_NAME = 'mobile-kitchen'
const DB_VERSION = 1

let dbp: Promise<IDBPDatabase> | null = null
function db() {
  if (!dbp) {
    dbp = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains('events')) d.createObjectStore('events', { keyPath: 'id' })
        if (!d.objectStoreNames.contains('applications')) {
          const s = d.createObjectStore('applications', { keyPath: 'id' })
          s.createIndex('eventId', 'eventId')
        }
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files')
      },
    })
  }
  return dbp
}

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const objectUrls = new Map<string, string>()

const ADMIN_FLAG = 'mk.admin'

/** ブラウザ内で完結するアダプタ。デモと単独運用のための既定バックエンド。 */
export class LocalAdapter implements DataAdapter {
  readonly kind = 'local' as const
  readonly adminNeedsEmail = false

  async listEvents(): Promise<EventRecord[]> {
    const all = (await (await db()).getAll('events')) as EventRecord[]
    return all.sort((a, b) => a.startAt.localeCompare(b.startAt))
  }

  async getEvent(id: string) {
    return ((await (await db()).get('events', id)) as EventRecord | undefined) ?? null
  }

  async createEvent(draft: EventDraft): Promise<EventRecord> {
    const now = new Date().toISOString()
    const rec: EventRecord = { ...draft, id: uid(), createdAt: now, updatedAt: now }
    await (await db()).put('events', rec)
    return rec
  }

  async updateEvent(id: string, patch: Partial<EventDraft>): Promise<EventRecord> {
    const cur = await this.getEvent(id)
    if (!cur) throw new Error('イベントが見つかりません')
    const next: EventRecord = { ...cur, ...patch, updatedAt: new Date().toISOString() }
    await (await db()).put('events', next)
    return next
  }

  async deleteEvent(id: string) {
    const d = await db()
    await d.delete('events', id)
    const apps = await this.listApplications(id)
    await Promise.all(apps.map((a) => d.delete('applications', a.id)))
  }

  async listApplications(eventId?: string): Promise<ApplicationRecord[]> {
    const d = await db()
    const all = (
      eventId
        ? await d.getAllFromIndex('applications', 'eventId', eventId)
        : await d.getAll('applications')
    ) as ApplicationRecord[]
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async createApplication(draft: ApplicationDraft): Promise<ApplicationRecord> {
    const now = new Date().toISOString()
    const rec: ApplicationRecord = {
      ...draft,
      id: uid(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    await (await db()).put('applications', rec)
    return rec
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus) {
    const d = await db()
    const cur = (await d.get('applications', id)) as ApplicationRecord | undefined
    if (!cur) throw new Error('申込が見つかりません')
    const next: ApplicationRecord = { ...cur, status, updatedAt: new Date().toISOString() }
    await d.put('applications', next)
    return next
  }

  async deleteApplication(id: string) {
    await (await db()).delete('applications', id)
  }

  async uploadFile(file: File): Promise<Attachment> {
    const id = uid()
    await (await db()).put('files', file, id)
    return { id, name: file.name, mime: file.type, size: file.size, url: `local:${id}` }
  }

  async resolveUrl(attachment: Attachment): Promise<string> {
    if (!attachment.url.startsWith('local:')) return attachment.url
    const key = attachment.url.slice('local:'.length)
    const cached = objectUrls.get(key)
    if (cached) return cached
    const blob = (await (await db()).get('files', key)) as Blob | undefined
    if (!blob) return ''
    const url = URL.createObjectURL(blob)
    objectUrls.set(key, url)
    return url
  }

  async adminSignIn({ password }: { email: string; password: string }) {
    if (password !== ADMIN_PASSCODE) throw new Error('パスコードが違います')
    localStorage.setItem(ADMIN_FLAG, '1')
  }

  async adminSignOut() {
    localStorage.removeItem(ADMIN_FLAG)
  }

  async isAdmin() {
    return localStorage.getItem(ADMIN_FLAG) === '1'
  }
}
