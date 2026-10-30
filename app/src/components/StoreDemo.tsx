import { useMemo, useState } from 'react'
import type { Exhibit } from '../data'
import { Icon } from './icons'

export const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ'

/** Cửa hàng dùng thử sống: bấm thêm vào giỏ, mở giỏ, đặt hàng thử. */
export function StoreDemo({ x, mode = 'full' }: { x: Exhibit; mode?: 'full' | 'mini' }) {
  const glyph = x.hue === 'green' ? 'leaf' : 'hammer'
  const [cart, setCart] = useState<Record<number, number>>({})
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [pop, setPop] = useState(false)

  const count = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart],
  )
  const total = useMemo(
    () =>
      Object.entries(cart).reduce(
        (sum, [k, qty]) => sum + x.products[Number(k)].price * qty,
        0,
      ),
    [cart, x.products],
  )

  const add = (i: number) => {
    setCart((c) => ({ ...c, [i]: (c[i] ?? 0) + 1 }))
    setPop(true)
    setTimeout(() => setPop(false), 320)
  }

  if (mode === 'mini') {
    return (
      <div className="device">
        <div className="device-bar">
          <i></i>
          <i></i>
          <i></i>
          <span className="device-url">{x.id}.pages.dev</span>
        </div>
        <div className={`shop hue-${x.hue}`}>
          <div className="shop-top">
            <span className="shop-logo"></span>
            <span className="shop-name"></span>
            <span className="shop-nav">
              <i></i>
              <i></i>
              <i></i>
            </span>
            <span className="shop-cart">
              <Icon name="cart" />
              <b>0</b>
            </span>
          </div>
          <div className="shop-hero">
            <div className="l1"></div>
            <div className="l2"></div>
            <span className="cta"></span>
          </div>
          <div className="shop-grid">
            {x.products.slice(0, 3).map((p) => (
              <div className="p-tile" key={p.name}>
                <div className="p-img">
                  <Icon name={glyph} />
                </div>
                <div className="p-name"></div>
                <div className="p-row">
                  <span className="p-price">{fmt(p.price)}</span>
                  <span className="p-add">+</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="device" data-team={x.id}>
      <div className="device-bar">
        <i></i>
        <i></i>
        <i></i>
        <span className="device-url">https://{x.id}.pages.dev</span>
      </div>
      <div className={`shop hue-${x.hue}`}>
        <div className="shop-top">
          <span className="shop-logo"></span>
          <span className="shop-name"></span>
          <span className="shop-nav">
            <i></i>
            <i></i>
            <i></i>
          </span>
          <button
            type="button"
            className="shop-cart"
            aria-label="Mở giỏ hàng"
            onClick={() => {
              setDone(false)
              setOpen((o) => !o)
            }}
          >
            <Icon name="cart" />
            <b className={pop ? 'pop' : ''}>{count}</b>
          </button>
        </div>
        <div className="shop-hero">
          <div className="l1"></div>
          <div className="l2"></div>
          <span className="cta"></span>
        </div>
        <div className="shop-grid">
          {x.products.map((p, i) => (
            <div className="p-tile" key={p.name}>
              <div className="p-img">
                <Icon name={glyph} />
              </div>
              <div className="p-name-text">{p.name}</div>
              <div className="p-row">
                <span className="p-price">{fmt(p.price)}</span>
                <button
                  type="button"
                  className="p-add"
                  aria-label={`Thêm ${p.name} vào giỏ`}
                  onClick={() => add(i)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={`cart-panel ${open ? 'open' : ''}`}>
          {done ? (
            <div className="co-success">
              <span className="stamp">PASS</span>
              <p>
                Đơn thử đã được ghi nhận. Đây đúng là cảm giác khách hàng của
                nhóm nhận được khi mua hàng.
              </p>
              <p className="code">TEST-{x.id.toUpperCase()}</p>
              <p className="cart-note">
                Môi trường kiểm thử của lớp, không phát sinh giao dịch thật.
              </p>
              <button
                type="button"
                className="btn plain"
                style={{ marginTop: 14 }}
                onClick={() => {
                  setDone(false)
                }}
              >
                Mua tiếp
              </button>
            </div>
          ) : count === 0 ? (
            <>
              <h4>Giỏ hàng của bạn</h4>
              <p className="cart-empty">
                Chưa có món nào. Bấm dấu cộng ở một sản phẩm để thêm vào giỏ.
              </p>
            </>
          ) : (
            <>
              <h4>Giỏ hàng của bạn</h4>
              {Object.entries(cart).map(([k, qty]) => {
                const p = x.products[Number(k)]
                return (
                  <div className="cart-row" key={k}>
                    <span>
                      {p.name} × {qty}
                    </span>
                    <span className="cp">{fmt(p.price * qty)}</span>
                  </div>
                )
              })}
              <div className="cart-total">
                <span>Tổng cộng</span>
                <span className="cp">{fmt(total)}</span>
              </div>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setDone(true)
                  setCart({})
                }}
              >
                Đặt hàng thử
              </button>
              <p className="cart-note">
                Môi trường kiểm thử của lớp, không phải đơn hàng thật.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
