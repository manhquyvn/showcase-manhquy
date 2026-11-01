import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useReducedMotion } from 'motion/react'
import { SHOWCASE_DATA, type Exhibit } from '../data'
import { useLiveExhibits } from '../lib/live'
import { StoreDemo } from '../components/StoreDemo'
import { MilestoneChips, StatusBlock } from '../components/StatusBlock'
import { Icon } from '../components/icons'
import { EmptyState } from '../components/states'
import { Slide } from '../components/animate-ui/primitives/effects/slide'
import { CountingNumber } from '../components/animate-ui/primitives/texts/counting-number'

export const Route = createFileRoute('/')({ component: Home })

/** Bỏ dấu tiếng Việt để phụ huynh gõ không dấu vẫn khớp (mục 4.4). */
function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/** Khối tìm theo tên con: gõ biệt danh → lọc danh sách đội ngay tại chỗ, không thêm endpoint. */
function TeamPick({ exhibits }: { exhibits: Exhibit[] }) {
  const [q, setQ] = useState('')
  const fq = fold(q)
  const filtered = fq
    ? exhibits.filter((x) => fold(`${x.team} ${x.members.join(' ')}`).includes(fq))
    : exhibits
  const firstNick = (exhibits[0]?.members[0] ?? '').replace(/^Biệt danh\s+/i, '')
  return (
    <div className="team-search">
      <label htmlFor="team-search-input">Tìm theo tên con</label>
      <input
        id="team-search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={firstNick ? `Gõ biệt danh của con, ví dụ: ${firstNick}` : 'Gõ biệt danh của con'}
        autoComplete="off"
      />
      {filtered.length > 0 ? (
        <div className="team-pick">
          {filtered.map((x) => (
            <Link key={x.id} className="pick" to="/du-an/$teamId" params={{ teamId: x.id }}>
              <span className="dot"></span>
              <span>{x.team}</span>
              <small>{x.members.join(', ')}</small>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState>
          Chưa thấy tên này trong hai đội. Phụ huynh kiểm tra lại biệt danh, hoặc xem cả hai đội ở dưới.
        </EmptyState>
      )}
    </div>
  )
}

function Home() {
  const D = SHOWCASE_DATA
  const { exhibits } = useLiveExhibits()
  const reduceMotion = useReducedMotion()
  return (
    <main>
      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-grid-bg" aria-hidden="true"></div>
        <div className="wrap hero-in">
          <Slide asChild offset={24}>
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
          </Slide>
          <Slide asChild offset={24} delay={150}>
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
          </Slide>
        </div>
      </section>

      {/* DỰ ÁN */}
      <section className="exhibits" id="san-pham">
        <div className="wrap">
          <Slide asChild inView offset={20}>
            <h2 className="sec">Tình trạng dự án của từng nhóm</h2>
          </Slide>
          <p className="sec-sub">
            Mỗi nhóm là một dự án của các con trong lớp. Thanh tiến độ cho
            biết nhóm đã qua những mốc nào, đang ở đâu và bước tiếp theo là
            gì.
          </p>
          <TeamPick exhibits={exhibits} />
          <div>
            {exhibits.map((x, idx) => (
              <Slide
                asChild
                inView
                offset={36}
                delay={idx * 100}
                key={x.id}
              >
              <article
                className={`feature ${idx % 2 ? 'flip' : ''}`}
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
              </Slide>
            ))}
          </div>
        </div>
      </section>

      {/* SỐ LIỆU */}
      <section className="stats">
        <div className="wrap">
          <Slide asChild inView offset={20}>
            <h2 className="sec">Con số thay lời giới thiệu</h2>
          </Slide>
          <div className="stats-grid">
            {D.stats.map((s, i) => (
              <Slide asChild inView offset={24} delay={i * 110} key={s.label}>
              <div className="stat">
                <p className="num">
                  {reduceMotion ? (
                    s.value
                  ) : (
                    <CountingNumber number={s.value} inView />
                  )}
                  <span className="suffix">{s.suffix}</span>
                </p>
                <p>{s.label}</p>
              </div>
              </Slide>
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
