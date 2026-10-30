import { Link, createFileRoute } from '@tanstack/react-router'
import { SHOWCASE_DATA } from '../data'
import { useLiveExhibits, useTeamChecklist } from '../lib/live'
import { StoreDemo } from '../components/StoreDemo'
import { MilestoneChips, StatusBlock } from '../components/StatusBlock'
import { FeedSection } from '../components/FeedSection'

export const Route = createFileRoute('/du-an/$teamId')({
  component: TeamPage,
  head: ({ params }) => {
    const seed = SHOWCASE_DATA.exhibits.find((e) => e.id === params.teamId)
    return {
      meta: [
        {
          title: seed
            ? `${seed.team} · ${seed.field} — Phòng triển lãm số`
            : 'Dự án — Phòng triển lãm số',
        },
      ],
    }
  },
})

function TeamPage() {
  const { teamId } = Route.useParams()
  const { exhibits, extras, loaded } = useLiveExhibits()
  const checklist = useTeamChecklist(teamId)
  const D = SHOWCASE_DATA

  const seedX = D.exhibits.find((e) => e.id === teamId)
  const liveX = loaded ? exhibits.find((e) => e.id === teamId) : undefined
  const x = liveX ?? seedX

  if (!x) {
    return (
      <main>
        <section className="exhibits" style={{ paddingTop: 128 }}>
          <div className="wrap">
            {loaded ? (
              <>
                <h2 className="sec">Không tìm thấy nhóm này</h2>
                <p className="sec-sub">
                  Địa chỉ này không ứng với nhóm nào đang trưng bày. Nhóm có
                  thể đã được đổi tên hoặc khóa học đã chuyển sang đợt mới.
                </p>
                <div className="f-actions">
                  <Link className="btn primary" to="/">
                    Về trang chủ
                  </Link>
                </div>
              </>
            ) : (
              <p className="adm-note">Đang tải thông tin nhóm…</p>
            )}
          </div>
        </section>
      </main>
    )
  }

  const extra = extras[teamId]
  const handover = extra?.handover ?? null
  const readyPct =
    checklist.total > 0 ? Math.round((checklist.done / checklist.total) * 100) : 0

  return (
    <main>
      <section className="exhibits" style={{ paddingTop: 128 }}>
        <div className="wrap">
          <p className="team" style={{ marginBottom: 10 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              ← Tất cả dự án
            </Link>
          </p>
          <h2 className="sec">
            {x.team} · {x.field}
          </h2>
          <p className="sec-sub">
            {x.classes} · Thành viên: {x.members.join(', ')}
          </p>

          <div className="feature" style={{ marginTop: 44 }}>
            <div className="f-media">
              <StoreDemo x={x} />
            </div>
            <div className="f-body">
              <p className="summary">{x.summary}</p>
              <MilestoneChips x={x} />
              <StatusBlock x={x} />
              <blockquote className="f-quote">
                <span>“{x.quote}”</span>
                <footer>Nhóm tự tổng kết cuối học phần</footer>
              </blockquote>
              {(x.demoUrl !== '#' || x.repoUrl !== '#') && (
                <div className="f-actions">
                  {x.demoUrl !== '#' && (
                    <a
                      className="btn primary"
                      href={x.demoUrl}
                      target="_blank"
                      rel="noopener"
                    >
                      Xem sản phẩm đang chạy
                    </a>
                  )}
                  {x.repoUrl !== '#' && (
                    <a
                      className="btn plain"
                      href={x.repoUrl}
                      target="_blank"
                      rel="noopener"
                    >
                      Xem kho mã của nhóm
                    </a>
                  )}
                </div>
              )}
              {x.sample && (
                <p className="sample-flag">
                  Gian trưng bày mẫu, chờ thay bằng dữ liệu thật của nhóm khi
                  khóa chạy.
                </p>
              )}
            </div>
          </div>

          {x.upgrades.length > 0 && (
            <div style={{ marginTop: 72, maxWidth: 720 }}>
              <h2 className="sec" style={{ fontSize: 30 }}>
                Nâng cấp nhóm đã làm
              </h2>
              <ul className="ready-list">
                {x.upgrades.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: 72 }}>
            <h2 className="sec" style={{ fontSize: 30 }}>
              Hành trình của nhóm qua các mốc
            </h2>
            <div className="m-timeline" style={{ marginTop: 30, maxWidth: 720 }}>
              {x.milestones.map((m) => {
                const j = D.journey.find((s) => s.code === m)
                return (
                  <div className="m-stop" key={m}>
                    <span className="m-dot"></span>
                    <div>
                      <b>
                        {m}
                        {j ? ` · ${j.title}` : ''}
                      </b>
                      <p>{j ? j.text : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 72, maxWidth: 720 }}>
            <h2 className="sec" style={{ fontSize: 30 }}>
              Sẵn sàng cho buổi trưng bày
            </h2>
            {!checklist.loaded && <p className="adm-note">Đang tải danh sách kiểm tra…</p>}
            {checklist.loaded && checklist.total === 0 && (
              <p className="adm-note">
                Giáo viên chưa lập danh sách kiểm tra cho nhóm này.
              </p>
            )}
            {checklist.total > 0 && (
              <>
                <p className="sec-sub" style={{ fontSize: 16 }}>
                  Đã xong {checklist.done} / {checklist.total} mục ({readyPct}%).
                </p>
                <div
                  className="ready-bar"
                  role="progressbar"
                  aria-valuenow={checklist.done}
                  aria-valuemin={0}
                  aria-valuemax={checklist.total}
                >
                  <span style={{ width: `${readyPct}%` }}></span>
                </div>
                <ul className="ready-list">
                  {checklist.items.map((item, i) => (
                    <li key={`${item.label}-${i}`}>
                      <span
                        className={item.done ? 'ready-mark done' : 'ready-mark'}
                        aria-hidden="true"
                      >
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

          <FeedSection teamId={x.id} teamName={x.team} />
        </div>
      </section>
    </main>
  )
}
