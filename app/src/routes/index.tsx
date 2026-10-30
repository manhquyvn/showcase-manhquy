import { Link, createFileRoute } from '@tanstack/react-router'
import { SHOWCASE_DATA } from '../data'
import { useLiveExhibits } from '../lib/live'
import { StoreDemo } from '../components/StoreDemo'
import { MilestoneChips, StatusBlock } from '../components/StatusBlock'
import { Icon } from '../components/icons'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const D = SHOWCASE_DATA
  const { exhibits } = useLiveExhibits()
  return (
    <main>
      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-grid-bg" aria-hidden="true"></div>
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="dot"></span> Trang dành cho phụ huynh
            </span>
            <h1 className="hero-title">
              Con bạn đang <span className="hl">chỉ huy AI</span> xây website
              đầu tiên của mình
            </h1>
            <p className="hero-sub">
              Tại đây phụ huynh xem được dự án của nhóm con đang ở mốc nào,
              con đã học được gì và sản phẩm chạy thật trông ra sao.
            </p>
            <div className="hero-cta">
              <a className="btn primary" href="#san-pham">
                Xem dự án của con
              </a>
              <Link className="btn plain" to="/lo-trinh">
                Xem lộ trình 24 buổi
              </Link>
            </div>
            <p className="hero-meta mono">
              manhquy.is-a.dev · hai nhóm · hai học phần · một sản phẩm xuyên
              suốt
            </p>
          </div>
          <div className="hero-cards" aria-hidden="true">
            {exhibits.map((x) => (
              <div className="mini-card" key={x.id}>
                <StoreDemo x={x} mode="mini" />
                <div className="cap">
                  <b>{x.field}</b>
                  <span>{x.team.replace('Nhóm ', '')} · Đạt mốc M3</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DỰ ÁN */}
      <section className="exhibits" id="san-pham">
        <div className="wrap">
          <h2 className="sec">Tình trạng dự án của từng nhóm</h2>
          <p className="sec-sub">
            Mỗi nhóm là một dự án của các con trong lớp. Thanh tiến độ cho
            biết nhóm đã qua những mốc nào, đang ở đâu và bước tiếp theo là
            gì.
          </p>
          <div className="team-pick">
            {exhibits.map((x) => (
              <Link
                key={x.id}
                className="pick"
                to="/du-an/$teamId"
                params={{ teamId: x.id }}
              >
                <span className="dot"></span>
                <span>{x.team}</span>
                <small>{x.members.join(', ')}</small>
              </Link>
            ))}
          </div>
          <div>
            {exhibits.map((x, idx) => (
              <article
                className={`feature ${idx % 2 ? 'flip' : ''}`}
                key={x.id}
                id={`team-${x.id}`}
              >
                <div className="f-media">
                  <StoreDemo x={x} />
                  <p className="try-hint">
                    <Icon name="cart" />
                    Cửa hàng chạy thử ngay tại đây: bấm dấu cộng để mua như
                    khách thật.
                  </p>
                </div>
                <div className="f-body">
                  <p className="team">{x.team}</p>
                  <h3>{x.field}</h3>
                  <p className="meta">
                    {x.classes} · {x.members.length} thành viên:{' '}
                    {x.members.join(', ')}
                  </p>
                  <p className="summary">{x.summary}</p>
                  <MilestoneChips x={x} />
                  <StatusBlock x={x} />
                  <blockquote className="f-quote">
                    <span>“{x.quote}”</span>
                    <footer>Nhóm tự tổng kết cuối học phần</footer>
                  </blockquote>
                  <div className="f-actions">
                    <Link
                      className="btn primary"
                      to="/du-an/$teamId"
                      params={{ teamId: x.id }}
                    >
                      Xem hành trình của nhóm
                    </Link>
                  </div>
                  {x.sample && (
                    <p className="sample-flag">
                      Gian trưng bày mẫu, chờ thay bằng dữ liệu thật của nhóm
                      khi khóa chạy.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SỐ LIỆU */}
      <section className="stats">
        <div className="wrap">
          <h2 className="sec">Con số thay lời giới thiệu</h2>
          <div className="stats-grid">
            {D.stats.map((s) => (
              <div className="stat" key={s.label}>
                <p className="num">
                  {s.value}
                  <span className="suffix">{s.suffix}</span>
                </p>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KẾT */}
      <section className="finale">
        <div className="wrap">
          <div className="finale-card">
            <h2>Buổi showcase là nơi con trình diễn trước người xem thật</h2>
            <p>
              Buổi 12 của mỗi học phần, các con trình diễn sản phẩm đang chạy
              thật và trả lời vấn đáp cá nhân. Tình trạng dự án được cập nhật
              tại đây ngay sau buổi trình diễn.
            </p>
            <Link className="btn primary" to="/phu-huynh">
              Dành cho phụ huynh
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
