import { useEffect, useState } from 'react'
import { bytes } from '../lib/format'
import { useStore } from '../lib/store'
import type { Attachment } from '../lib/types'

const icon = (mime: string, name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (mime.startsWith('image/')) return '🖼'
  if (mime === 'application/pdf' || ext === 'pdf') return '📄'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['doc', 'docx'].includes(ext)) return '📝'
  return '📎'
}

/** 添付をダウンロード可能なリンクとして並べる。ローカル保存分は都度 objectURL に解決する。 */
export function AttachmentList({
  items,
  onRemove,
}: {
  items: Attachment[]
  onRemove?: (id: string) => void
}) {
  const { resolveUrl } = useStore()
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true
    ;(async () => {
      const next: Record<string, string> = {}
      for (const a of items) next[a.id] = await resolveUrl(a)
      if (alive) setUrls(next)
    })()
    return () => {
      alive = false
    }
  }, [items, resolveUrl])

  if (items.length === 0) return null

  return (
    <ul className="space-y-1.5">
      {items.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5"
        >
          <span className="text-[17px] leading-none">{icon(a.mime, a.name)}</span>
          <a
            href={urls[a.id] || undefined}
            target="_blank"
            rel="noreferrer"
            download={a.name}
            className="min-w-0 flex-1 truncate text-[13.5px] font-medium hover:underline"
          >
            {a.name}
          </a>
          <span className="shrink-0 text-[11.5px] text-faint tabular">{bytes(a.size)}</span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(a.id)}
              aria-label={`${a.name} を削除`}
              className="shrink-0 text-muted transition-colors hover:text-danger"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
