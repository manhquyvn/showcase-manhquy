// Tầng máy chủ của showcase: chỉ chạy trong Worker (Cloudflare Pages).
// Binding lấy qua module cloudflare:workers bằng import động (bản build
// Rolldown không resolve được import tĩnh) — đã kiểm chứng bằng /api/health:
// env có DB và FILES, đọc được D1 thật.
let envCache: Record<string, unknown> | null = null
async function cfEnv(): Promise<Record<string, unknown>> {
  if (!envCache) {
    // @ts-ignore module chỉ tồn tại ở runtime Cloudflare
    const cf = await import(/* @vite-ignore */ 'cloudflare:workers')
    envCache = (cf as { env: Record<string, unknown> }).env
  }
  return envCache
}

export interface D1Prepared {
  bind: (...args: unknown[]) => D1Prepared
  first: <T = Record<string, unknown>>() => Promise<T | null>
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>
  run: () => Promise<unknown>
}
export interface D1Like {
  prepare: (sql: string) => D1Prepared
}

export async function db(): Promise<D1Like> {
  const d = (await cfEnv()).DB as D1Like | undefined
  if (!d) throw new Error('D1 binding DB is not available')
  return d
}

export interface R2Like {
  put: (key: string, value: string | ArrayBuffer | ArrayBufferView | Blob) => Promise<unknown>
  get: (key: string) => Promise<unknown>
}

export async function files(): Promise<R2Like> {
  const f = (await cfEnv()).FILES as R2Like | undefined
  if (!f) throw new Error('R2 binding FILES is not available')
  return f
}

// Nhật ký audit: nuốt mọi lỗi để ghi log không bao giờ làm gãy luồng chính
// (ví dụ khi migration 0003 chưa được áp trên môi trường đang chạy).
export async function logAudit(
  d: D1Like,
  action: string,
  targetType: string,
  targetId: string,
  detail: string,
): Promise<void> {
  try {
    await d
      .prepare('INSERT INTO audit_log(action, target_type, target_id, detail) VALUES(?, ?, ?, ?)')
      .bind(action, targetType, targetId, detail)
      .run()
  } catch {
    // cố ý bỏ qua
  }
}

export async function isFrozen(d: D1Like): Promise<boolean> {
  try {
    const row = await d
      .prepare("SELECT value FROM settings WHERE key = 'site_frozen'")
      .first<{ value: string }>()
    return row?.value === '1'
  } catch {
    return false
  }
}

export const DEFAULT_CHECKLIST: string[] = [
  'Sản phẩm mở được trên điện thoại và máy tính',
  'Giá và mô tả sản phẩm hiển thị đúng',
  'Nhóm đã chạy thử toàn bộ quy trình cửa hàng một lượt',
  'Mỗi thành viên trình bày được phần mình làm',
  'Đã kiểm thử chéo và sửa lỗi theo góp ý của nhóm bạn',
  'Sản phẩm đã sẵn sàng bàn giao để mang về',
]

export async function seedChecklist(d: D1Like, teamId: string): Promise<void> {
  const row = await d
    .prepare('SELECT COUNT(*) AS n FROM checklist_items WHERE team_id = ?')
    .bind(teamId)
    .first<{ n: number }>()
  if ((row?.n ?? 0) > 0) return
  for (let i = 0; i < DEFAULT_CHECKLIST.length; i++) {
    await d
      .prepare('INSERT INTO checklist_items(team_id, label, done, sort) VALUES(?, ?, 0, ?)')
      .bind(teamId, DEFAULT_CHECKLIST[i], i)
      .run()
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const t = await request.text()
    if (!t) return {}
    const parsed = JSON.parse(t)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.replace(/\s+/g, ' ').trim().slice(0, max)
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmacHex(key: string, text: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const COOKIE = 'sc_admin'

async function adminHash(): Promise<string | null> {
  const row = await (await db())
    .prepare("SELECT value FROM settings WHERE key = 'admin_pass_hash'")
    .first<{ value: string }>()
  return row?.value ?? null
}

export async function checkPassword(password: string): Promise<boolean> {
  const stored = await adminHash()
  if (!stored || !password) return false
  return (await sha256Hex(password)) === stored
}

export async function issueCookie(): Promise<string> {
  const stored = (await adminHash()) ?? ''
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600
  const sig = await hmacHex(stored, String(exp))
  return `${COOKIE}=${exp}.${sig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`
}

export function clearCookie(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

export async function isAdmin(request: Request): Promise<boolean> {
  const stored = await adminHash()
  if (!stored) return false
  const header = request.headers.get('cookie') ?? ''
  const part = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`))
  if (!part) return false
  const value = part.slice(COOKIE.length + 1)
  const [expStr, sig] = value.split('.')
  const exp = Number(expStr)
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false
  return (await hmacHex(stored, expStr)) === sig
}
