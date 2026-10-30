import { useEffect, useRef, useState } from 'react'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'

const THEME_INIT = `(function(){try{if(window.localStorage.getItem('showcase-theme')==='light'){document.documentElement.dataset.theme='light'}}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title: 'Phòng triển lãm số — Sản phẩm học sinh xây bằng AI Agent',
      },
      {
        name: 'description',
        content:
          'Trang dành cho phụ huynh: theo dõi tình trạng dự án website mà con đang xây cùng AI coding agent, các mốc con đã đạt và buổi trình diễn cuối khóa.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function FrozenBanner() {
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
  if (!frozen) return null
  return (
    <div className="frozen-banner" role="status">
      <div className="wrap">
        Khóa học đã kết thúc — trang đang ở chế độ lưu trữ đóng băng. Phụ
        huynh vẫn xem được toàn bộ hành trình và sản phẩm của các con.
      </div>
    </div>
  )
}

function ThemeToggle() {
  const [light, setLight] = useState(false)
  useEffect(() => {
    setLight(document.documentElement.dataset.theme === 'light')
  }, [])
  const toggle = () => {
    const next = !light
    setLight(next)
    if (next) document.documentElement.dataset.theme = 'light'
    else delete document.documentElement.dataset.theme
    try {
      localStorage.setItem('showcase-theme', next ? 'light' : 'dark')
    } catch {
      /* bỏ qua */
    }
  }
  return (
    <button
      className="theme-btn"
      aria-label="Đổi nền sáng hoặc tối"
      onClick={toggle}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
      </svg>
      <span>{light ? 'DARK' : 'LIGHT'}</span>
    </button>
  )
}

function ToTop() {
  const [show, setShow] = useState(false)
  const fg = useRef<SVGCircleElement>(null)
  const CIRC = 2 * Math.PI * 21
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const p = max > 0 ? h.scrollTop / max : 0
      if (fg.current) {
        fg.current.style.strokeDasharray = String(CIRC)
        fg.current.style.strokeDashoffset = String(CIRC * (1 - p))
      }
      setShow(h.scrollTop > 600)
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [CIRC])
  return (
    <button
      className={`totop ${show ? 'show' : ''}`}
      aria-label="Về đầu trang"
      onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg className="ring" viewBox="0 0 48 48">
        <circle className="ring-bg" cx="24" cy="24" r="21" />
        <circle className="ring-fg" ref={fg} cx="24" cy="24" r="21" />
      </svg>
      <span className="arrow">↑</span>
    </button>
  )
}

function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect
          x="6.2"
          y="6.2"
          width="13.6"
          height="13.6"
          rx="1.5"
          transform="rotate(45 13 13)"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="13" cy="13" r="2.6" fill="#1AA3C4" />
      </svg>
    </span>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <HeadContent />
      </head>
      <body>
        <FrozenBanner />
        <header className="site">
          <div className="wrap site-in">
            <div className="brand">
              <Mark />
              <span>PHÒNG TRIỂN LÃM SỐ</span>
            </div>
            <nav className="main">
              <Link to="/">Dự án của con</Link>
              <Link to="/lo-trinh">Lộ trình học</Link>
              <Link to="/phu-huynh">Dành cho phụ huynh</Link>
            </nav>
            <div className="head-actions">
              <ThemeToggle />
              <Link className="btn primary" to="/">
                Xem dự án của con
              </Link>
            </div>
          </div>
        </header>

        {children}

        <footer className="site">
          <div className="wrap foot-in">
            <span>
              Khóa học Build Website bằng AI Coding Agent · Giáo viên: Nguyễn
              Mạnh Quý
            </span>
            <span className="mono">manhquy.is-a.dev</span>
            <span>
              Trang chỉ hiển thị tên nhóm và biệt danh của học sinh, nhằm bảo
              vệ riêng tư của các em.{' '}
              <Link to="/quan-tri" style={{ color: 'var(--accent-small)' }}>
                Quản trị (giáo viên)
              </Link>
            </span>
          </div>
        </footer>

        <div className="mobile-bar">
          <Link className="btn primary" to="/">
            Dự án của con
          </Link>
          <a
            className="btn plain"
            href="https://www.manhquy.id.vn/vi/contact"
            target="_blank"
            rel="noopener"
          >
            Liên hệ giáo viên
          </a>
        </div>

        <ToTop />
        <Scripts />
      </body>
    </html>
  )
}
