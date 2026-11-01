import * as THREE from 'three'
import type { Exhibit } from '../../data'
import { fmt } from '../StoreDemo'

/**
 * Texture vẽ bằng Canvas 2D cho sân khấu 3D (DESIGN-SYSTEM mục 6.4).
 * Chỉ chứa tên đội, lĩnh vực, tên + giá sản phẩm — KHÔNG nướng biệt danh thành viên.
 * Gradient chép đúng cặp hex của token --shop-blue / --shop-green (Canvas 2D không đọc biến CSS).
 */
const GRADIENTS: Record<string, [string, string]> = {
  blue: ['#0A2E3D', '#1AA3C4'],
  green: ['#101E33', '#2A3B57'],
}

function truncate(s: string, max = 18): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function createShopTexture(team: Exhibit, maxAniso = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 680
  const ctx = canvas.getContext('2d')!
  const [c1, c2] = GRADIENTS[team.hue] ?? GRADIENTS.blue
  const grad = ctx.createLinearGradient(0, 0, 1024 * 0.45, 680)
  grad.addColorStop(0, c1)
  grad.addColorStop(1, c2)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 680)

  // Thanh trình duyệt giả ở đỉnh — khớp .device-bar bản 2D
  ctx.fillStyle = '#0B1220'
  ctx.fillRect(0, 0, 1024, 64)
  ctx.fillStyle = 'rgba(147,167,192,0.55)'
  for (const cx of [28, 58, 88]) {
    ctx.beginPath()
    ctx.arc(cx, 32, 9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(226,232,240,0.08)'
  roundRect(ctx, 118, 14, 430, 36, 9)
  ctx.fill()
  ctx.fillStyle = '#93A7C0'
  ctx.font = '600 22px "JetBrains Mono", monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText(`https://${team.id}.pages.dev`, 134, 33)

  // Tên đội + lĩnh vực
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 44px "Space Grotesk", sans-serif'
  ctx.fillText(team.team, 44, 118)
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '400 30px "Inter", sans-serif'
  ctx.fillText(team.field, 44, 164)

  // Ba ô sản phẩm đầu — khớp ngữ pháp .p-tile
  const products = team.products.slice(0, 3)
  const tileW = 296
  const tileH = 330
  const gap = 24
  const startX = (1024 - (tileW * 3 + gap * 2)) / 2
  const startY = 230
  products.forEach((p, i) => {
    const x = startX + i * (tileW + gap)
    ctx.fillStyle = 'rgba(255,255,255,0.13)'
    roundRect(ctx, x, startY, tileW, tileH, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 2
    roundRect(ctx, x, startY, tileW, tileH, 16)
    ctx.stroke()
    // Ô ảnh sản phẩm (khối sáng, không ảnh ngoài)
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    roundRect(ctx, x + 20, startY + 20, tileW - 40, 150, 10)
    ctx.fill()
    // Dấu hình học tối giản ở ô ảnh (shape vẽ tay, không ký tự trang trí)
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(x + tileW / 2, startY + 95, 30, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.beginPath()
    ctx.arc(x + tileW / 2, startY + 95, 9, 0, Math.PI * 2)
    ctx.fill()
    // Tên sản phẩm
    ctx.font = '600 26px "Inter", sans-serif'
    ctx.fillText(truncate(p.name), x + 20, startY + 215)
    // Giá dạng pill
    const price = fmt(p.price)
    ctx.font = '600 24px "JetBrains Mono", monospace'
    const w = ctx.measureText(price).width + 30
    ctx.fillStyle = 'rgba(255,255,255,0.30)'
    roundRect(ctx, x + 20, startY + 252, w, 44, 22)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(price, x + 35, startY + 275)
  })
  if (products.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '400 28px "Inter", sans-serif'
    ctx.fillText('Đội chưa đăng sản phẩm.', 44, 300)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = Math.min(4, maxAniso)
  return tex
}

export function createPassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 200
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 512, 200)
  ctx.strokeStyle = '#22C55E'
  ctx.lineWidth = 6
  roundRect(ctx, 10, 10, 492, 180, 24)
  ctx.stroke()
  ctx.fillStyle = '#22C55E'
  ctx.font = '700 92px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('PASS', 256, 104)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function createShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(128, 64, 8, 128, 64, 120)
  g.addColorStop(0, 'rgba(0,0,0,0.85)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.save()
  ctx.translate(128, 64)
  ctx.scale(1, 0.5)
  ctx.translate(-128, -64)
  ctx.fillRect(0, -64, 256, 256)
  ctx.restore()
  const tex = new THREE.CanvasTexture(canvas)
  return tex
}
