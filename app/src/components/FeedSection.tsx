import { useCallback, useEffect, useState } from 'react'

interface FeedUpdate { id: number; milestone: string | null; text: string; pinned: number; created_at: string }
interface FeedComment { id: number; author_name: string; text: string; created_at: string }

function fmtDate(iso: string): string {
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Feed cập nhật tiến độ của nhóm, đọc từ D1 qua /api/feed.
 * Nội dung công khai ở đây đều đã qua giáo viên duyệt (status = approved).
 * Gửi cập nhật và lời động viên đều vào hàng chờ duyệt, không hiện ngay.
 */
export function FeedSection({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [updates, setUpdates] = useState<FeedUpdate[]>([])
  const [comments, setComments] = useState<FeedComment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [updText, setUpdText] = useState('')
  const [updMilestone, setUpdMilestone] = useState('')
  const [cmtName, setCmtName] = useState('')
  const [cmtText, setCmtText] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [frozen, setFrozen] = useState(false)

  useEffect(() => {
    let on = true
    fetch('/api/teams')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (on && d?.site?.frozen) setFrozen(true)
      })
      .catch(() => undefined)
    return () => {
      on = false
    }
  }, [])

  const load = useCallback(() => {
    fetch(`/api/feed?team=${encodeURIComponent(teamId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setUpdates(d.updates ?? [])
          setComments(d.comments ?? [])
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [teamId])

  useEffect(() => { load() }, [load])

  const post = async (path: string, body: Record<string, string>) => {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error((d as { error?: string }).error ?? 'Gửi chưa thành công')
  }

  const submitUpdate = async () => {
    try {
      await post('/api/submit-update', { teamId, text: updText, milestone: updMilestone })
      setUpdText('')
      setUpdMilestone('')
      setMsg('Đã gửi cập nhật. Giáo viên duyệt xong, cập nhật mới hiện trên trang của nhóm.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gửi chưa thành công')
    }
  }

  const submitSubscribe = async () => {
    try {
      await post('/api/subscribe', { teamId, email })
      setEmail('')
      setMsg('Đã đăng ký nhận thông báo của nhóm. Khi có cập nhật mới được duyệt, hệ thống sẽ gửi tin theo email này.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Đăng ký chưa thành công')
    }
  }

  const submitComment = async () => {
    try {
      await post('/api/submit-comment', { teamId, authorName: cmtName, text: cmtText })
      setCmtText('')
      setMsg('Đã gửi lời động viên. Giáo viên duyệt xong, lời động viên mới hiện trên trang.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gửi chưa thành công')
    }
  }

  return (
    <div style={{ marginTop: 72 }}>
      <h2 className="sec" style={{ fontSize: 30 }}>Cập nhật tiến độ của {teamName}</h2>
      <p className="sec-sub">
        Các mốc mới nhất do nhóm gửi và giáo viên duyệt. Phụ huynh xem tại đây là
        thấy tình trạng mới nhất, không cần chờ tới buổi trình diễn.
      </p>

      {!loaded && <p className="adm-note">Đang tải cập nhật…</p>}
      {loaded && updates.length === 0 && (
        <p className="adm-note">Chưa có cập nhật nào được duyệt cho nhóm này. Cập nhật đầu tiên sẽ hiện tại đây.</p>
      )}
      <div className="m-timeline" style={{ marginTop: 26, maxWidth: 720 }}>
        {updates.map((u) => (
          <div className="m-stop" key={u.id}>
            <span className="m-dot"></span>
            <div>
              <b>
                {u.milestone ? `${u.milestone} · ` : ''}{fmtDate(u.created_at)}
                {u.pinned ? ' · Đã ghim' : ''}
              </b>
              <p>{u.text}</p>
            </div>
          </div>
        ))}
      </div>

      {comments.length > 0 && (
        <div style={{ marginTop: 36, maxWidth: 720 }}>
          <h3 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 20, marginBottom: 12 }}>
            Lời động viên đã duyệt
          </h3>
          {comments.map((c) => (
            <blockquote className="f-quote" key={c.id} style={{ marginBottom: 14 }}>
              <span>“{c.text}”</span>
              <footer>{c.author_name} · {fmtDate(c.created_at)}</footer>
            </blockquote>
          ))}
        </div>
      )}

      {frozen ? (
        <p className="adm-note" style={{ maxWidth: 720 }} role="status">
          Khóa học đã kết thúc — trang đang ở chế độ lưu trữ đóng băng nên
          không nhận cập nhật, lời động viên hay đăng ký email mới. Toàn bộ
          cập nhật và lời động viên đã duyệt vẫn xem được ở trên.
        </p>
      ) : (
      <div className="adm-card" style={{ maxWidth: 720 }}>
        <h3>Gửi cập nhật hoặc lời động viên</h3>
        <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5, marginBottom: 6 }}>
          Mọi nội dung gửi tại đây đều qua giáo viên duyệt rồi mới hiện công khai.
        </p>
        <div className="adm-grid">
          <div className="adm-field full">
            <label>Cập nhật tiến độ của nhóm (thành viên nhóm hoặc giáo viên gửi)</label>
            <textarea value={updText} onChange={(e) => setUpdText(e.target.value)} maxLength={1000} />
          </div>
          <div className="adm-field">
            <label>Mốc liên quan, nếu có</label>
            <input type="text" value={updMilestone} onChange={(e) => setUpdMilestone(e.target.value)} placeholder="Ví dụ: M2" maxLength={12} />
          </div>
          <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn primary" onClick={submitUpdate}>Gửi cập nhật chờ duyệt</button>
          </div>
          <div className="adm-field">
            <label>Tên người gửi lời động viên (phụ huynh)</label>
            <input type="text" value={cmtName} onChange={(e) => setCmtName(e.target.value)} maxLength={60} />
          </div>
          <div className="adm-field full">
            <label>Lời động viên</label>
            <textarea value={cmtText} onChange={(e) => setCmtText(e.target.value)} maxLength={500} />
          </div>
          <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn plain" onClick={submitComment}>Gửi lời động viên chờ duyệt</button>
          </div>
          <div className="adm-field">
            <label>Email nhận thông báo của nhóm (phụ huynh)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="phuhuynh@vidu.com" maxLength={120} />
          </div>
          <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn plain" onClick={submitSubscribe}>Đăng ký nhận thông báo</button>
          </div>
        </div>
        {msg && <p className="adm-note" role="status">{msg}</p>}
      </div>
      )}
    </div>
  )
}
