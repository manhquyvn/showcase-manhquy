import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { EmptyState, SkeletonTimeline } from './states'

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
  const [loadError, setLoadError] = useState(false)
  const [sending, setSending] = useState<'update' | 'comment' | 'subscribe' | null>(null)
  const [toast, setToast] = useState('')
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
    setLoaded(false)
    setLoadError(false)
    fetch(`/api/feed?team=${encodeURIComponent(teamId)}`)
      .then((r) => {
        if (!r.ok) throw new Error('feed')
        return r.json()
      })
      .then((d) => {
        if (d) {
          setUpdates(d.updates ?? [])
          setComments(d.comments ?? [])
        }
        setLoaded(true)
      })
      // Trạng thái lỗi phân biệt với rỗng (mục 4.9/4.14): lỗi có nút Thử lại, rỗng chỉ hiện khi tải xong mà không có dữ liệu.
      .catch(() => {
        setLoadError(true)
        setLoaded(true)
      })
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

  // Thông báo inline là bản ghi bền; toast chỉ là phản hồi tức thời tự ẩn sau 6 giây (mục 4.13, tùy chọn lát 4 — làm cùng lát này).
  const showMsg = (text: string) => {
    setMsg(text)
    setToast(text)
    window.setTimeout(() => setToast(''), 6000)
  }

  const submitUpdate = async () => {
    setSending('update')
    try {
      await post('/api/submit-update', { teamId, text: updText, milestone: updMilestone })
      setUpdText('')
      setUpdMilestone('')
      showMsg('Đã gửi cập nhật. Giáo viên duyệt xong, cập nhật mới hiện trên trang của nhóm.')
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Gửi chưa thành công')
    } finally {
      setSending(null)
    }
  }

  const submitSubscribe = async () => {
    setSending('subscribe')
    try {
      await post('/api/subscribe', { teamId, email })
      setEmail('')
      showMsg('Đã đăng ký nhận thông báo của nhóm. Khi có cập nhật mới được duyệt, hệ thống sẽ gửi tin theo email này.')
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Đăng ký chưa thành công')
    } finally {
      setSending(null)
    }
  }

  const submitComment = async () => {
    setSending('comment')
    try {
      await post('/api/submit-comment', { teamId, authorName: cmtName, text: cmtText })
      setCmtText('')
      showMsg('Đã gửi lời động viên. Giáo viên duyệt xong, lời động viên mới hiện trên trang.')
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Gửi chưa thành công')
    } finally {
      setSending(null)
    }
  }

  return (
    <div style={{ marginTop: 72 }}>
      <h2 className="sec" style={{ fontSize: 30 }}>Cập nhật tiến độ của {teamName}</h2>
      <p className="sec-sub">
        Các mốc mới nhất do nhóm gửi và giáo viên duyệt. Phụ huynh xem tại đây là
        thấy tình trạng mới nhất, không cần chờ tới buổi trình diễn.
      </p>

      {!loaded && <SkeletonTimeline />}
      {loaded && loadError && (
        <EmptyState
          action={
            <button type="button" className="btn plain" onClick={load}>
              Thử lại
            </button>
          }
        >
          Chưa tải được cập nhật. Kiểm tra kết nối rồi bấm Thử lại.
        </EmptyState>
      )}
      {loaded && !loadError && updates.length === 0 && (
        <EmptyState
          action={
            <Link to="/lo-trinh">Xem lộ trình học</Link>
          }
        >
          Chưa có cập nhật nào được duyệt cho nhóm này. Cập nhật đầu tiên sẽ hiện tại đây.
        </EmptyState>
      )}
      <div className="m-timeline" style={{ marginTop: 26, maxWidth: 720 }}>
        {updates.map((u, idx) => (
          <div className="m-stop" key={u.id}>
            <span className="m-dot"></span>
            <div>
              <b>
                {u.milestone ? `${u.milestone} · ` : ''}{fmtDate(u.created_at)}
                {u.pinned ? ' · Đã ghim' : ''}
                {idx === 0 && <span className="new-chip">Mới</span>}
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
            <button type="button" className="btn primary" onClick={submitUpdate} disabled={sending !== null}>{sending === 'update' ? 'Đang gửi…' : 'Gửi cập nhật chờ duyệt'}</button>
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
            <button type="button" className="btn plain" onClick={submitComment} disabled={sending !== null}>{sending === 'comment' ? 'Đang gửi…' : 'Gửi lời động viên chờ duyệt'}</button>
          </div>
          <div className="adm-field">
            <label>Email nhận thông báo của nhóm (phụ huynh)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="phuhuynh@vidu.com" maxLength={120} />
          </div>
          <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn plain" onClick={submitSubscribe} disabled={sending !== null}>{sending === 'subscribe' ? 'Đang gửi…' : 'Đăng ký nhận thông báo'}</button>
          </div>
        </div>
        {msg && <p className="adm-note" role="status">{msg}</p>}
      </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
