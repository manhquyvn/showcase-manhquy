import { useState } from 'react'
import { SHOWCASE_DATA } from '../data'
import { Icon } from './icons'

const STOP_ICONS = ['users', 'rocket', 'pen', 'layers', 'cart', 'eye', 'spark', 'flag']

export function JourneyExplorer() {
  const [sel, setSel] = useState(1)
  const st = SHOWCASE_DATA.journey[sel]
  return (
    <div className="explorer">
      <div className="tabs" role="tablist" aria-label="Các chặng của khóa học">
        {SHOWCASE_DATA.journey.map((s, i) => (
          <button
            key={s.code}
            className="tab"
            role="tab"
            aria-selected={i === sel}
            onClick={() => setSel(i)}
          >
            <span className="tcode">{s.code}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>
      <div className="panel">
        <span className="icon-badge">
          <Icon name={STOP_ICONS[sel] ?? 'flag'} />
        </span>
        <div>
          <p className="p-tag">{st.tag}</p>
          <h3>{st.title}</h3>
          <p>{st.text}</p>
          <p className="p-code">
            Chặng {st.code} · {st.code.startsWith('M') ? 'Học phần 1' : 'Trong chương trình'}
          </p>
        </div>
      </div>
    </div>
  )
}

export function PrStepper() {
  const [sel, setSel] = useState(0)
  const st = SHOWCASE_DATA.prSteps[sel]
  return (
    <>
      <div className="steps">
        {SHOWCASE_DATA.prSteps.map((s, i) => (
          <button
            key={s.title}
            className="step"
            aria-selected={i === sel}
            onClick={() => setSel(i)}
          >
            <span className="icon-badge">
              <Icon name={s.icon} />
            </span>
            <h3>{s.title}</h3>
          </button>
        ))}
      </div>
      <div className="panel step-panel">
        <span className="icon-badge">
          <Icon name={st.icon} />
        </span>
        <div>
          <p className="p-tag">Trạm {sel + 1} / 5</p>
          <h3>{st.title}</h3>
          <p>{st.text}</p>
        </div>
      </div>
    </>
  )
}

export function Receipt() {
  const [open, setOpen] = useState(false)
  return (
    <div className={`receipt ${open ? 'open' : ''}`}>
      <button
        className="receipt-btn"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>Biên nhận kiểm chứng của một thay đổi, bấm để xem</span>
        <span className="pm">+</span>
      </button>
      <div
        className="receipt-body"
        style={{ maxHeight: open ? 900 : 0 }}
      >
        <div className="term">
          <div className="term-bar">
            <i></i>
            <i></i>
            <i></i>
            <span className="term-path">
              ~/du-an/nhom-sao-bang — pull-request #tinh-nang-gio-hang
            </span>
          </div>
          <div className="pr-card">
            <div>
              <div className="pr-head">
                <span className="pr-ic">
                  <Icon name="pr" />
                </span>
                <div>
                  <p className="pr-title">
                    Thêm giỏ hàng và tính tổng tiền theo dữ liệu sản phẩm
                  </p>
                  <p className="pr-sub">
                    Nhóm Sao Băng mở pull request này · nhánh{' '}
                    <span className="mono">tinh-nang/gio-hang</span> vào{' '}
                    <span className="mono">main</span>
                  </p>
                </div>
              </div>
              <p className="pr-diff">
                <span className="add">+212 dòng thêm</span>
                <span className="del">−18 dòng xóa</span>
                <span>5 tệp thay đổi</span>
              </p>
            </div>
            <div>
              <div className="checks">
                {[
                  'Bản xem trước chạy đúng trên điện thoại',
                  'Tổng tiền khớp dữ liệu sản phẩm',
                  'Người duyệt khác nhóm tác giả',
                ].map((c) => (
                  <div className="check" key={c}>
                    <span className="ok">
                      <Icon name="check" />
                    </span>
                    <span>{c}</span>
                    <b>PASS</b>
                  </div>
                ))}
              </div>
              <div className="merge-row">
                <div className="avatars" aria-hidden="true">
                  <i style={{ background: '#1AA3C4' }}>A</i>
                  <i style={{ background: '#2A3B57' }}>B</i>
                  <i style={{ background: '#475569' }}>C</i>
                </div>
                <span style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
                  3 thành viên đã xem, 1 duyệt chính thức
                </span>
                <span className="merged-badge">
                  <Icon name="pr" />
                  MERGED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ROLES = [
  {
    t: 'Điều phối',
    d: 'Lập kế hoạch của buổi, theo dõi đầu việc và quyết định khi nhóm bị kẹt.',
  },
  {
    t: 'Vận hành agent',
    d: 'Trực tiếp giao việc cho agent, đọc kỹ phần mã agent đề xuất sửa trước khi chấp nhận.',
  },
  {
    t: 'Kiểm duyệt',
    d: 'Duyệt pull request của bạn khác, chạy kiểm chứng trên điện thoại và có quyền trả lại.',
  },
  {
    t: 'Ghi chép và trình bày',
    d: 'Ghi nhật ký buổi, cập nhật tài liệu và đại diện nhóm trình bày ở buổi showcase.',
  },
]

export function RolesAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <div className="role-list">
      {ROLES.map((r, i) => {
        const open = openIdx === i
        return (
          <div
            key={r.t}
            className={`role-row ${open ? 'open' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setOpenIdx(open ? null : i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setOpenIdx(open ? null : i)
              }
            }}
          >
            <span className="idx">0{i + 1}</span>
            <h3>{r.t}</h3>
            <span className="pm">+</span>
            <div
              className="role-a"
              style={{ maxHeight: open ? 200 : 0 }}
            >
              <p>{r.d}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FaqList() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <div className="faq-list">
      {SHOWCASE_DATA.faqs.map((f, i) => {
        const open = openIdx === i
        return (
          <div className={`faq-item ${open ? 'open' : ''}`} key={f.q}>
            <button
              className="faq-q"
              aria-expanded={open}
              onClick={() => setOpenIdx(open ? null : i)}
            >
              <span>{f.q}</span>
              <span className="pm">+</span>
            </button>
            <div className="faq-a" style={{ maxHeight: open ? 400 : 0 }}>
              <p>{f.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
