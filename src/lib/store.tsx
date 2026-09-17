import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { loadDb, type DataAdapter } from './db'
import { eventStats, type EventStats } from './format'
import { seedIfEmpty } from './seed'
import type {
  ApplicationDraft,
  ApplicationRecord,
  ApplicationStatus,
  Attachment,
  EventDraft,
  EventRecord,
} from './types'

interface StoreValue {
  db: DataAdapter | null
  events: EventRecord[]
  applications: ApplicationRecord[]
  /** イベントIDごとの申込件数。 */
  counts: Record<string, number>
  /** 残枠・締切・社会的証明をまとめた導出値。 */
  statsFor: (event: EventRecord) => EventStats
  loading: boolean
  error: string | null
  mode: 'local' | 'cloud'
  refresh: () => Promise<void>
  createEvent: (d: EventDraft) => Promise<EventRecord>
  updateEvent: (id: string, p: Partial<EventDraft>) => Promise<EventRecord>
  deleteEvent: (id: string) => Promise<void>
  createApplication: (d: ApplicationDraft) => Promise<ApplicationRecord>
  setApplicationStatus: (id: string, s: ApplicationStatus) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  uploadFile: (f: File) => Promise<Attachment>
  resolveUrl: (a: Attachment) => Promise<string>
}

const Ctx = createContext<StoreValue | null>(null)

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DataAdapter | null>(null)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!db) return
    try {
      // 申込一覧は主催者だけが読める。出店者では拒否されるのが正しい挙動
      // なので、ここでの失敗は空配列として扱い、画面は止めない。
      const [e, c, a] = await Promise.all([
        db.listEvents(),
        db.listApplicationCounts(),
        db.listApplications().catch(() => [] as ApplicationRecord[]),
      ])
      setEvents(e)
      setApplications(a)
      setCounts(c)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [db])

  useEffect(() => {
    let alive = true
    loadDb().then((adapter) => {
      if (alive) setDb(adapter)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!db) return
    let alive = true
    ;(async () => {
      try {
        await seedIfEmpty(db)
      } catch {
        // シード失敗は致命的ではないので握りつぶして読み込みを続ける。
      }
      if (!alive) return
      await refresh()
      if (alive) setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [db, refresh])

  const require = () => {
    if (!db) throw new Error('データベースを準備中です。少し待ってからお試しください。')
    return db
  }

  const value: StoreValue = {
    db,
    events,
    applications,
    counts,
    statsFor: (event) => eventStats(event, applications, counts),
    loading,
    error,
    mode: db?.kind ?? 'local',
    refresh,
    createEvent: async (d) => {
      const r = await require().createEvent(d)
      await refresh()
      return r
    },
    updateEvent: async (id, p) => {
      const r = await require().updateEvent(id, p)
      await refresh()
      return r
    },
    deleteEvent: async (id) => {
      await require().deleteEvent(id)
      await refresh()
    },
    createApplication: async (d) => {
      const r = await require().createApplication(d)
      await refresh()
      return r
    },
    setApplicationStatus: async (id, s) => {
      await require().updateApplicationStatus(id, s)
      await refresh()
    },
    deleteApplication: async (id) => {
      await require().deleteApplication(id)
      await refresh()
    },
    uploadFile: (f) => require().uploadFile(f),
    resolveUrl: (a) => require().resolveUrl(a),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
