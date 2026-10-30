import { createFileRoute } from '@tanstack/react-router'
import { db, isAdmin, json } from '../../../lib/server'

interface AuditRow {
  id: number; ts: string; action: string; target_type: string; target_id: string; detail: string
}

export const Route = createFileRoute('/api/admin/audit')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const raw = Number(new URL(request.url).searchParams.get('limit') ?? 100)
        const limit = Number.isFinite(raw) && raw > 0 ? Math.min(200, Math.floor(raw)) : 100
        const d = await db()
        const entries = await d
          .prepare('SELECT id, ts, action, target_type, target_id, detail FROM audit_log ORDER BY id DESC LIMIT ?')
          .bind(limit)
          .all<AuditRow>()
        return json({
          entries: entries.results.map((e) => ({
            id: e.id,
            ts: e.ts,
            action: e.action,
            target_type: e.target_type,
            target_id: e.target_id,
            detail: e.detail,
          })),
        })
      },
    },
  },
})
