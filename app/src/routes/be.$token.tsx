import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { mapApiTeam, type ApiTeam, type ChecklistItem, type Handover } from '../lib/live'
import { StatusBlock } from '../components/StatusBlock'

export const Route = createFileRoute('/be/$token')({
  component: ChildPage,
  head: () => ({
    meta: [
      { title: 'Trang theo dõi của bé — Phòng triển lãm số' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
})

interface ChildData {
  nickname: string
  team: ApiTeam
  checklist: { items: ChecklistItem[]; done: number; total: number }
}

const LABELS = ['M0', 'M1', 'M2', 'M3', 'HP2', 'HP2+']

function ChildPage() {
  const { token } = Route.useParams()
  const [data, setData] = useState<ChildData | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'invalid'>('loading')

  useEffect(() => {
    let on = true
    fetch(`/api/child?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!on) return
        if (!r.ok) {
          setState('invalid')
          return
        }
        const d = (await r.json()) as ChildData
        if (!on) return
        if (!d || !d.nickname || !d.team) {
          setState('invalid')
          return
        }
        setData(d)
        setState('ok')
      })
      .catch(() => {
        if (on) setState('invalid')
      })
    return () => {
      on = false
    }
  }, [token])

  return (
    <main>
      <section className="exhibits" style={{ paddingTop: 128 }}>
        <div className="wrap">
          <p className="team" style={{ marginBottom: 10 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              ← Về trang chủ
            </Link>
          </p>

          {state === 'loading' && <p className="adm-note">Đang tải trang theo dõi…</p>}

          {state === 'invalid' && (
            <>
              <h2 className="sec">Liên kết không còn hiệu lực</h2>
              <p className="sec-sub">
                Liên kết không còn hiệu lực, phụ huynh liên hệ giáo viên để
                nhận link mới.
              </p>
              <div className="f-actions">
                <Link className="btn primary" to="/">
                  Về trang chủ
                </Link>
              </div>
            </>
          )}

          {state === 'ok' && data && <ChildBody data={data} />}
        </div>
      </section>
    </main>
  )
}

function ChildBody({ data }: { data: ChildData }) {
  const exhibit = (() => {
    try {
      return mapApiTeam(data.team)
    } catch {
      return null
    }
  })()
  const checklist = data.checklist ?? { items: [], done: 0, total: 0 }
  const items = Array.isArray(checklist.items) ? checklist.items : []
  const done = typeof checklist.done === 'number' ? checklist.done : items.filter((i) => i.done).length
  const total = typeof checklist.total === 'number' ? checklist.total : items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const handover: Handover | null = data.team.handover ?? null

  return (
    <div className="child-wrap">
      <h2 className="sec">Trang theo dõi của bé {data.nickname}</h2>
      <p className="sec-sub">
        {data.team.team}
        {data.team.field ? ` · ${data.team.field}` : ''}
      </p>

      {exhibit ? (
        <div style={{ maxWidth: 720, marginTop: 32 }}>
          <StatusBlock x={exhibit} />
        </div>
      ) : (
        <div className="status" style={{ maxWidth: 720, marginTop: 32 }}>
          <div className="s-line">
            <span className="s-now">{data.team.statusText ?? ''}</span>
            <span className="s-upd">{data.team.updatedNote ?? ''}</span>
          </div>
          <div className="track-labels" style={{ marginTop: 12 }}>
            {LABELS.map((c, i) => (
              <span key={c} style={i < (data.team.progressDone ?? 0) ? { color: 'var(--accent-small)' } : undefined}>
                {c}
              </span>
            ))}
          </div>
          <p className="s-next">
            <b>Bước tiếp theo:</b> {data.team.nextStep ?? ''}
          </p>
        </div>
      )}

      <div style={{ marginTop: 56, maxWidth: 720 }}>
        <h2 className="sec" style={{ fontSize: 30 }}>
          Sẵn sàng cho buổi trưng bày
        </h2>
        {total === 0 ? (
          <p className="adm-note">Giáo viên chưa lập danh sách kiểm tra cho nhóm này.</p>
        ) : (
          <>
            <p className="sec-sub" style={{ fontSize: 16 }}>
              Đã xong {done} / {total} mục ({pct}%).
            </p>
            <div
              className="ready-bar"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
            >
              <span style={{ width: `${pct}%` }}></span>
            </div>
            <ul className="ready-list">
              {items.map((item, i) => (
                <li key={`${item.label}-${i}`}>
                  <span className={item.done ? 'ready-mark done' : 'ready-mark'} aria-hidden="true">
                    {item.done ? '✓' : '○'}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {handover && (
        <div className="status handover-box" style={{ maxWidth: 720 }}>
          <span className="stamp">PASS</span>
          <div className="s-line">
            <span className="s-now">Đã bàn giao cuối khóa</span>
            {handover.date && <span className="s-upd">{handover.date}</span>}
          </div>
          {handover.note && <p className="s-next">{handover.note}</p>}
        </div>
      )}
    </div>
  )
}
