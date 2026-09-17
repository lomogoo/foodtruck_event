import { useMemo, useState } from 'react'
import { AttachmentList } from '../../components/AttachmentList'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/Toast'
import { Badge, Button, Card, Divider, EmptyState, Input, KV, Segmented, Select } from '../../components/ui'
import { applicationsToCsv, downloadCsv } from '../../lib/csv'
import { APP_STATUS_LABEL, FIRE_LABEL, GAS_LABEL, fmtDateTime, mm, totalWatt } from '../../lib/format'
import { useStore } from '../../lib/store'
import { LotteryPanel } from './LotteryPanel'
import type { ApplicationRecord } from '../../lib/types'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

const TONE: Record<ApplicationRecord['status'], 'neutral' | 'ok' | 'warn'> = {
  pending: 'warn',
  approved: 'ok',
  rejected: 'neutral',
  withdrawn: 'neutral',
}

/** 申込の受付簿。承認・見送りの判断に必要な項目を1枚に畳んで見せる。 */
export function AdminApplications({
  eventId,
  onChangeEvent,
}: {
  eventId: string
  onChangeEvent: (id: string) => void
}) {
  const { events, applications, statsFor, setApplicationStatus, deleteApplication } = useStore()
  const toast = useToast()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<ApplicationRecord | null>(null)

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return applications.filter((a) => {
      if (eventId !== 'all' && a.eventId !== eventId) return false
      if (status !== 'all' && a.status !== status) return false
      if (a.attendance !== 'attend') return false
      if (!needle) return true
      return [a.shopName, a.repName, a.email, a.phone].some((v) => v.toLowerCase().includes(needle))
    })
  }, [applications, eventId, status, q])

  const counts = useMemo(() => {
    const scoped = applications.filter(
      (a) => a.attendance === 'attend' && (eventId === 'all' || a.eventId === eventId),
    )
    return {
      all: scoped.length,
      pending: scoped.filter((a) => a.status === 'pending').length,
      approved: scoped.filter((a) => a.status === 'approved').length,
    }
  }, [applications, eventId])

  const title = (id: string) => events.find((e) => e.id === id)?.title ?? '(削除済み)'
  const scopedEvent = eventId === 'all' ? undefined : events.find((e) => e.id === eventId)

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <Select value={eventId} onChange={(e) => onChangeEvent(e.target.value)}>
          <option value="all">すべてのイベント（{applications.filter((a) => a.attendance === 'attend').length}件）</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>

        <Segmented
          value={status}
          onChange={setStatus}
          size="sm"
          options={[
            { value: 'all', label: `すべて ${counts.all}` },
            { value: 'pending', label: `確認待ち ${counts.pending}` },
            { value: 'approved', label: `承認 ${counts.approved}` },
            { value: 'rejected', label: '見送り' },
          ]}
        />

        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="店舗名・代表者・連絡先で検索"
            className="flex-1"
          />
          <Button
            size="md"
            className="shrink-0"
            disabled={list.length === 0}
            onClick={() => {
              const name = eventId === 'all' ? '全イベント' : title(eventId)
              downloadCsv(`出店者一覧_${name}_${new Date().toISOString().slice(0, 10)}.csv`, applicationsToCsv(list, events))
              toast(`${list.length}件を書き出しました`, 'ok')
            }}
          >
            CSV
          </Button>
        </div>
      </div>

      {scopedEvent?.selectionMethod === 'lottery' && (
        <LotteryPanel event={scopedEvent} stats={statsFor(scopedEvent)} applications={applications} />
      )}

      {list.length === 0 ? (
        <EmptyState
          icon="📥"
          title="該当する申込はありません"
          description="出店者が申し込むと、ここに届きます。条件を変えて探してみてください。"
        />
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Card key={a.id} className="p-4" onClick={() => setDetail(a)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold">{a.shopName}</h3>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">
                    {a.repName} ・ {a.phone}
                  </p>
                  {eventId === 'all' && (
                    <p className="mt-0.5 truncate text-[11.5px] text-faint">{title(a.eventId)}</p>
                  )}
                </div>
                <Badge tone={TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge>{FIRE_LABEL[a.fireSource]}</Badge>
                <Badge>{totalWatt(a).toLocaleString()}W</Badge>
                {a.bringsGenerator && <Badge>発電機</Badge>}
                {a.hasInsurance && <Badge tone="ok">PL保険</Badge>}
                {a.files.length > 0 && <Badge>書類{a.files.length}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        size="full"
        title={detail?.shopName}
        footer={
          detail && (
            <div className="flex gap-2">
              <Button
                full
                onClick={async () => {
                  await setApplicationStatus(detail.id, 'rejected')
                  setDetail(null)
                  toast('見送りにしました')
                }}
              >
                見送り
              </Button>
              <Button
                full
                accent
                onClick={async () => {
                  await setApplicationStatus(detail.id, 'approved')
                  setDetail(null)
                  toast('承認しました', 'ok')
                }}
              >
                出店を承認する
              </Button>
            </div>
          )
        }
      >
        {detail && (
          <ApplicationDetail
            a={detail}
            eventTitle={title(detail.eventId)}
            onDelete={async () => {
              await deleteApplication(detail.id)
              setDetail(null)
              toast('申込を削除しました')
            }}
          />
        )}
      </Sheet>
    </div>
  )
}

function ApplicationDetail({
  a,
  eventTitle,
  onDelete,
}: {
  a: ApplicationRecord
  eventTitle: string
  onDelete: () => void
}) {
  const gas = a.gasKind === 'other' ? a.gasKindOther : a.gasKind ? GAS_LABEL[a.gasKind] : '—'
  const usesGas = a.fireSource === 'gas' || a.fireSource === 'both'
  const usesCharcoal = a.fireSource === 'charcoal' || a.fireSource === 'both'

  return (
    <div className="space-y-5 pb-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={TONE[a.status]}>{APP_STATUS_LABEL[a.status]}</Badge>
        <span className="text-[12px] text-faint">{fmtDateTime(a.createdAt)} 申込</span>
      </div>
      <p className="text-[13px] text-muted">{eventTitle}</p>

      <Block title="連絡先">
        <KV k="店舗名" v={a.shopName} />
        <KV k="代表者名" v={a.repName} />
        <KV k="メール" v={<a href={`mailto:${a.email}`} className="text-accent hover:underline">{a.email}</a>} />
        <KV k="電話" v={<a href={`tel:${a.phone}`} className="text-accent hover:underline">{a.phone}</a>} />
      </Block>

      <Block title="火気">
        <KV k="使用" v={FIRE_LABEL[a.fireSource]} />
        {usesGas && (
          <>
            <KV k="ガス種別" v={gas} />
            <KV k="本数" v={`${a.gasCylinderCount}本${a.gasCylinderSize ? `（${a.gasCylinderSize}）` : ''}`} />
          </>
        )}
        {usesCharcoal && (
          <KV k="消火方法" v={<span className="font-normal">{a.charcoalExtinguishMethod || '—'}</span>} />
        )}
        {a.fireSource !== 'none' && <KV k="消火器" v={`${a.fireExtinguisherCount}本`} />}
      </Block>

      <Block title="電気">
        {a.appliances.length === 0 ? (
          <KV k="使用機器" v="なし" />
        ) : (
          a.appliances.map((x) => (
            <KV key={x.id} k={x.name || '（無名）'} v={`${x.watt.toLocaleString()}W × ${x.qty}`} />
          ))
        )}
        <KV k="合計" v={`${totalWatt(a).toLocaleString()}W`} />
        <KV k="発電機" v={a.bringsGenerator ? `あり${a.generatorNote ? `（${a.generatorNote}）` : ''}` : 'なし'} />
      </Block>

      <Block title="出店内容">
        <KV
          k="提供メニュー"
          v={
            <span className="font-normal">
              {a.menu.map((m) => `${m.name}${m.price ? ` ¥${m.price.toLocaleString()}` : ''}`).join(' / ') || '—'}
            </span>
          }
        />
        <KV k="車体サイズ" v={`${mm(a.truckSize.length)} × ${mm(a.truckSize.width)} × ${mm(a.truckSize.height)}`} />
        {a.truckSize.expandedLength > 0 && (
          <KV k="展開時" v={`${mm(a.truckSize.expandedLength)} × ${mm(a.truckSize.expandedWidth)}`} />
        )}
        {a.vehicleNumber && <KV k="車両ナンバー" v={a.vehicleNumber} />}
        {a.foodLicenseNumber && <KV k="営業許可番号" v={a.foodLicenseNumber} />}
        <KV k="PL保険" v={a.hasInsurance ? '加入済み' : '未加入'} />
      </Block>

      {a.files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[12.5px] font-semibold text-muted">提出書類</h3>
          <AttachmentList items={a.files} />
        </div>
      )}

      {a.notes && (
        <div className="rounded-[var(--radius-md)] bg-[var(--c-surface-2)] p-4">
          <h3 className="mb-1 text-[12.5px] font-semibold text-muted">連絡事項</h3>
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{a.notes}</p>
        </div>
      )}

      <Divider />
      <button onClick={onDelete} className="text-[12.5px] text-muted transition-colors hover:text-danger">
        この申込を削除
      </button>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line p-4">
      <h3 className="mb-1 text-[12.5px] font-semibold text-muted">{title}</h3>
      <dl className="divide-y divide-[var(--c-line)]">{children}</dl>
    </div>
  )
}
