import type {
  ApplicationDraft,
  ApplicationRecord,
  ApplicationStatus,
  Attachment,
  EventDraft,
  EventRecord,
} from '../types'

/** ローカル/クラウドどちらのバックエンドでも満たす契約。 */
export interface DataAdapter {
  readonly kind: 'local' | 'cloud'

  listEvents(): Promise<EventRecord[]>
  getEvent(id: string): Promise<EventRecord | null>
  createEvent(draft: EventDraft): Promise<EventRecord>
  updateEvent(id: string, patch: Partial<EventDraft>): Promise<EventRecord>
  deleteEvent(id: string): Promise<void>

  listApplications(eventId?: string): Promise<ApplicationRecord[]>
  createApplication(draft: ApplicationDraft): Promise<ApplicationRecord>
  updateApplicationStatus(id: string, status: ApplicationStatus): Promise<ApplicationRecord>
  deleteApplication(id: string): Promise<void>

  /** 添付ファイルを保存し、参照可能な Attachment を返す。 */
  uploadFile(file: File): Promise<Attachment>
  /** Attachment を <img src> や <a href> で使える URL に解決する。 */
  resolveUrl(attachment: Attachment): Promise<string>

  /** 管理者ログイン。ローカルはパスコード、クラウドは Supabase Auth。 */
  adminSignIn(credentials: { email: string; password: string }): Promise<void>
  adminSignOut(): Promise<void>
  isAdmin(): Promise<boolean>
  /** ログインフォームでメール欄を出すか。 */
  readonly adminNeedsEmail: boolean
}
