import { createFileRoute } from '@tanstack/react-router'
import { db, isAdmin, json, logAudit, readBody } from '../../../lib/server'

export const Route = createFileRoute('/api/admin/moderate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        const kind = body.kind === 'comment' ? 'comments' : body.kind === 'update' ? 'updates' : null
        const action = body.action === 'approved' || body.action === 'hidden' ? body.action : null
        const id = Number(body.id)
        if (!kind || !action || !Number.isInteger(id) || id <= 0) {
          return json({ error: 'Yêu cầu không hợp lệ' }, 400)
        }
        const approvedAt = kind === 'updates' || kind === 'comments' ? "approved_at = CASE WHEN ? = 'approved' THEN datetime('now') ELSE approved_at END," : ''
        const d = await db()
        await d
          .prepare(`UPDATE ${kind} SET status = ?, ${approvedAt} approved_by = 'teacher' WHERE id = ?`)
          .bind(action, action, id)
          .run()
        await logAudit(d, 'moderate', kind, String(id), `kind=${body.kind} action=${action} id=${id}`)
        return json({ ok: true })
      },
    },
  },
})
