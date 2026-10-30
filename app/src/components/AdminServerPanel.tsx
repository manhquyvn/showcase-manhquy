import { useCallback, useEffect, useState } from 'react'

interface PendingUpdate { id: number; team_id: string; milestone: string | null; text: string; created_at: string }
interface PendingComment { id: number; team_id: string; author_name: string; text: string; created_at: string }
interface ServerTeam { id: string; name: string; status_text: string; next_step: string; updated_note: string; progress_done: number }
interface Queue {
  pendingUpdates: PendingUpdate[]; pendingComments: PendingComment[]
  pendingCount: number; teams: ServerTeam[]; subscriberCount: number
}

const LABELS = ['M0', 'M1', 'M2', 'M3', 'HP2', 'HP2+']

/**
 * Phân hệ quản trị phía máy chủ: đăng nhập giáo viên, hàng chờ duyệt
 * (cập nhật tiến độ + lời động viên) và sửa tình trạng nhóm ghi thẳng vào D1.
 * Phụ huynh thấy thay đổi ngay ở khối tình trạng và feed của trang nhóm.
 */
export function AdminServerPanel() {
  const [queue, setQueue] = useState<Queue | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [drafts, setDrafts] = useState<Record<string, ServerTeam>>({})

  const load = useCallback(() => {
    fetch('/api/admin/queue')
      .then(async (r) => {
        if (r.status === 401) { setAuthed(false); return null }
        return r.ok ? (await r.json()) as Queue : null
      })
      .then((d) => {
        if (d) {
          setAuthed(true)
          setQueue(d)
          setDrafts(Object.fromEntries(d.teams.map((t) => [t.id, { ...t }])))
        }
      })
      .catch(() => setAuthed(false))
  }, [])

  useEffect(() => { load() }, [load])

  const login = async () => {
    const r = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (r.ok) { setPassword(''); setMsg('Đã đăng nhập.'); load() }
    else setMsg('Mật khẩu chưa đúng.')
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false); setQueue(null); setMsg('Đã đăng xuất.')
  }

  const moderate = async (kind: 'update' | 'comment', id: number, action: 'approved' | 'hidden') => {
    const r = await fetch('/api/admin/moderate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id, action }),
    })
    setMsg(r.ok ? 'Đã xử lý mục trong hàng chờ.' : 'Xử lý chưa thành công.')
    if (r.ok) load()
  }

  const saveTeam = async (t: ServerTeam) => {
    const r = await fetch('/api/admin/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: t.id, statusText: t.status_text, nextStep: t.next_step,
        updatedNote: t.updated_note, progressDone: t.progress_done,
      }),
    })
    setMsg(r.ok ? `Đã lưu tình trạng của ${t.name} lên hệ thống. Phụ huynh xem trang nhóm sẽ thấy ngay.` : 'Lưu chưa thành công.')
    if (r.ok) load()
  }

  if (authed === null) return <p className="adm-note">Đang kiểm tra đăng nhập…</p>

  if (!authed) {
    return (
      <div className="adm-card">
        <h3>Quản trị trên hệ thống (giáo viên)</h3>
        <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
          Đăng nhập để duyệt cập nhật, duyệt lời động viên và sửa tình trạng nhóm.
          Thay đổi ghi thẳng vào cơ sở dữ liệu và hiện ngay trên trang của phụ huynh.
        </p>
        <div className="adm-grid" style={{ marginTop: 14 }}>
          <div className="adm-field">
            <label>Mật khẩu giáo viên</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void login() }} autoComplete="current-password" />
          </div>
          <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn primary" onClick={login}>Đăng nhập</button>
          </div>
        </div>
        {msg && <p className="adm-note" role="status">{msg}</p>}
      </div>
    )
  }

  return (
    <div className="adm-card">
      <h3>
        Hàng chờ duyệt{' '}
        {queue && queue.pendingCount > 0 && (
          <span className="chip" style={{ verticalAlign: 'middle' }}>{queue.pendingCount} mục đang chờ</span>
        )}
      </h3>
      <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
        {queue ? `${queue.subscriberCount} phụ huynh đã đăng ký nhận thông báo theo nhóm.` : ''}
      </p>

      {queue && queue.pendingUpdates.length === 0 && queue.pendingComments.length === 0 && (
        <p className="adm-note">Hàng chờ đang trống. Cập nhật và lời động viên mới sẽ hiện tại đây.</p>
      )}

      {queue?.pendingUpdates.map((u) => (
        <div className="adm-prod-row" key={`u${u.id}`} style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <b>Cập nhật · {u.team_id}</b>{u.milestone ? <span className="mono"> · {u.milestone}</span> : null}
            <p style={{ marginTop: 4 }}>{u.text}</p>
          </div>
          <button type="button" className="btn primary" onClick={() => moderate('update', u.id, 'approved')}>Duyệt</button>
          <button type="button" className="btn plain" onClick={() => moderate('update', u.id, 'hidden')}>Ẩn</button>
        </div>
      ))}
      {queue?.pendingComments.map((c) => (
        <div className="adm-prod-row" key={`c${c.id}`} style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <b>Lời động viên · {c.team_id}</b>
            <p style={{ marginTop: 4 }}>“{c.text}” — {c.author_name}</p>
          </div>
          <button type="button" className="btn primary" onClick={() => moderate('comment', c.id, 'approved')}>Duyệt</button>
          <button type="button" className="btn plain" onClick={() => moderate('comment', c.id, 'hidden')}>Ẩn</button>
        </div>
      ))}

      <h3 style={{ marginTop: 30 }}>Tình trạng nhóm trên hệ thống</h3>
      {queue?.teams.map((t) => {
        const d = drafts[t.id] ?? t
        const set = (p: Partial<ServerTeam>) => setDrafts((s) => ({ ...s, [t.id]: { ...d, ...p } }))
        return (
          <div key={t.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 18 }}>
            <b>{t.name}</b> <span className="mono" style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>/du-an/{t.id}</span>
            <div className="adm-grid">
              <div className="adm-field">
                <label>Tình trạng hiện tại</label>
                <input type="text" value={d.status_text} onChange={(e) => set({ status_text: e.target.value })} />
              </div>
              <div className="adm-field">
                <label>Ghi chú lần cập nhật</label>
                <input type="text" value={d.updated_note} onChange={(e) => set({ updated_note: e.target.value })} />
              </div>
              <div className="adm-field full">
                <label>Bước tiếp theo</label>
                <input type="text" value={d.next_step} onChange={(e) => set({ next_step: e.target.value })} />
              </div>
              <div className="adm-field full">
                <label>Tiến độ: đã qua {d.progress_done} / 6 chặng ({LABELS.slice(0, d.progress_done).join(', ') || 'chưa qua chặng nào'})</label>
                <input type="range" min={0} max={6} step={1} value={d.progress_done}
                  onChange={(e) => set({ progress_done: Number(e.target.value) })} />
              </div>
            </div>
            <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={() => saveTeam(d)}>
              Lưu lên hệ thống
            </button>
          </div>
        )
      })}

      <div className="adm-actions">
        <button type="button" className="btn plain" onClick={logout}>Đăng xuất</button>
      </div>
      {msg && <p className="adm-note" role="status">{msg}</p>}
    </div>
  )
}
