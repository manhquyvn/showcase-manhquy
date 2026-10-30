import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isAdmin, json, logAudit, readBody } from '../../../lib/server'

export const Route = createFileRoute('/api/admin/handover')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        const teamId = cleanText(body.teamId, 60)
        if (!/^[a-z0-9-]{2,60}$/.test(teamId)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        if (body.status !== 'returned' && body.status !== 'not_returned') {
          return json({ error: 'Trạng thái bàn giao không hợp lệ' }, 400)
        }
        const d = await db()
        const team = await d.prepare('SELECT id FROM teams WHERE id = ?').bind(teamId).first()
        if (!team) return json({ error: 'Không thấy nhóm' }, 404)

        if (body.status === 'returned') {
          const dateInput = cleanText(body.date, 20)
          const date = /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : new Date().toISOString().slice(0, 10)
          const note = cleanText(body.note, 500)
          await d
            .prepare('UPDATE teams SET handover_status = ?, handover_date = ?, handover_note = ? WHERE id = ?')
            .bind('returned', date, note, teamId)
            .run()
        } else {
          await d
            .prepare("UPDATE teams SET handover_status = '', handover_date = NULL, handover_note = '' WHERE id = ?")
            .bind(teamId)
            .run()
        }
        await logAudit(d, 'handover.set', 'team', teamId, `status=${body.status}`)
        return json({ ok: true })
      },
    },
  },
})
