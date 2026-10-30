import { createFileRoute } from '@tanstack/react-router'
import { db, files, isAdmin, json, logAudit, readBody, type D1Like } from '../../../lib/server'

async function getSetting(d: D1Like, key: string): Promise<string | null> {
  try {
    const row = await d.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>()
    return row?.value ?? null
  } catch {
    return null
  }
}

async function setSetting(d: D1Like, key: string, value: string): Promise<void> {
  await d.prepare('DELETE FROM settings WHERE key = ?').bind(key).run()
  await d.prepare('INSERT INTO settings(key, value) VALUES(?, ?)').bind(key, value).run()
}

async function safeAll<T>(d: D1Like, sql: string, limit?: number): Promise<T[]> {
  try {
    const stmt = d.prepare(sql)
    const rows = limit ? await stmt.bind(limit).all<T>() : await stmt.all<T>()
    return rows.results
  } catch {
    return []
  }
}

export const Route = createFileRoute('/api/admin/freeze')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const d = await db()
        const frozen = (await getSetting(d, 'site_frozen')) === '1'
        const frozenAtRaw = await getSetting(d, 'site_frozen_at')
        return json({ frozen, frozenAt: frozenAtRaw ? frozenAtRaw : null })
      },
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        if (typeof body.frozen !== 'boolean') return json({ error: 'Trường frozen phải là boolean' }, 400)
        const frozen = body.frozen
        const d = await db()
        const nowIso = new Date().toISOString()

        await setSetting(d, 'site_frozen', frozen ? '1' : '0')
        await setSetting(d, 'site_frozen_at', frozen ? nowIso : '')

        let snapshotKey: string | undefined
        if (frozen) {
          const teams = await safeAll<Record<string, unknown>>(d, 'SELECT * FROM teams ORDER BY created_at ASC')
          const products = await safeAll<Record<string, unknown>>(d, 'SELECT * FROM products ORDER BY team_id ASC, sort ASC')
          const updates = await safeAll<Record<string, unknown>>(d, 'SELECT * FROM updates ORDER BY id ASC')
          const comments = await safeAll<Record<string, unknown>>(d, 'SELECT * FROM comments ORDER BY id ASC')
          const subRow = await d.prepare('SELECT COUNT(*) AS n FROM subscribers').first<{ n: number }>()
          const checklistItems = await safeAll<Record<string, unknown>>(d, 'SELECT * FROM checklist_items ORDER BY team_id ASC, sort ASC')
          const consents = await safeAll<Record<string, unknown>>(d, 'SELECT * FROM consents ORDER BY team_id ASC, nickname ASC')
          const auditLog = await safeAll<Record<string, unknown>>(d, 'SELECT * FROM audit_log ORDER BY id DESC LIMIT ?', 500)
          const snapshot = {
            exportedAt: nowIso,
            teams,
            products,
            updates,
            comments,
            // Chỉ đếm số người đăng ký, tuyệt đối không xuất email trong snapshot.
            subscribers: { count: subRow?.n ?? 0 },
            checklist_items: checklistItems,
            consents,
            audit_log: auditLog,
          }
          snapshotKey = `snapshots/freeze-${nowIso.replace(/[:.]/g, '-')}.json`
          const store = await files()
          await store.put(snapshotKey, JSON.stringify(snapshot))
        }

        await logAudit(d, frozen ? 'freeze.on' : 'freeze.off', 'site', '', snapshotKey ? `snapshot=${snapshotKey}` : '')
        return json(snapshotKey ? { ok: true, frozen, snapshotKey } : { ok: true, frozen })
      },
    },
  },
})
