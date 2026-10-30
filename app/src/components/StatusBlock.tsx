import { useEffect, useState } from 'react'
import { SHOWCASE_DATA, type Exhibit } from '../data'

interface LiveTeam {
  id: string; statusText: string; nextStep: string; updatedNote: string; progressDone: number
}

/** Tình trạng sống từ D1: giáo viên sửa ở trang quản trị là phụ huynh thấy ngay, không cần build lại trang. */
function useLiveTeam(id: string): LiveTeam | null {
  const [live, setLive] = useState<LiveTeam | null>(null)
  useEffect(() => {
    let on = true
    fetch('/api/teams')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!on || !d?.teams) return
        const t = (d.teams as LiveTeam[]).find((e) => e.id === id)
        if (t) setLive(t)
      })
      .catch(() => undefined)
    return () => { on = false }
  }, [id])
  return live
}

const LABELS = ['M0', 'M1', 'M2', 'M3', 'HP2', 'HP2+']

function meaning(code: string): string {
  const j = SHOWCASE_DATA.journey.find((st) => st.code === code)
  if (j) return `${j.title}. ${j.text}`
  if (code === 'HP2')
    return 'Học phần 2: nâng cấp sản phẩm bằng AI, gồm harness, vòng lặp kiểm chứng và kết nối MCP.'
  return 'Học phần 2 nâng cao: đa agent, tự tạo skill và hook cho agent của nhóm.'
}

/** Khối tình trạng dự án: bấm từng chặng để xem ý nghĩa. */
export function StatusBlock({ x }: { x: Exhibit }) {
  const [note, setNote] = useState('Bấm vào từng chặng để xem ý nghĩa của chặng đó.')
  const [active, setActive] = useState(-1)
  const live = useLiveTeam(x.id)
  const statusText = live?.statusText ?? x.statusText
  const updatedNote = live?.updatedNote ?? x.updatedNote
  const nextStep = live?.nextStep ?? x.nextStep
  const progressDone = live?.progressDone ?? x.progressDone

  return (
    <div className="status">
      {progressDone >= 4 && <span className="stamp">PASS</span>}
      <div className="s-line">
        <span className="s-now">{statusText}</span>
        <span className="s-upd">{updatedNote}</span>
      </div>
      <div className="track">
        {LABELS.map((code, i) => (
          <button
            key={code}
            type="button"
            className={i < progressDone ? 'done' : ''}
            aria-pressed={active === i}
            aria-label={`Chặng ${code}`}
            onClick={() => {
              setActive(i)
              setNote(meaning(code))
            }}
          >
            <i></i>
          </button>
        ))}
      </div>
      <div className="track-labels">
        {LABELS.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <p className="track-note">{note}</p>
      <p className="s-next">
        <b>Bước tiếp theo:</b> {nextStep}
      </p>
    </div>
  )
}

export function MilestoneChips({ x }: { x: Exhibit }) {
  return (
    <div className="chips">
      {x.milestones.map((m) => (
        <span className="chip" key={m}>
          {m} · <span className="pass">PASS</span>
        </span>
      ))}
      {x.upgrades.map((u) => (
        <span className="chip up" key={u}>
          {u}
        </span>
      ))}
    </div>
  )
}
