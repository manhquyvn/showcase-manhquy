import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isFrozen, json, readBody } from '../../lib/server'

export const Route = createFileRoute('/api/subscribe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const d = await db()
        if (await isFrozen(d)) return json({ error: 'Trang đang ở chế độ đóng băng cuối khóa, tạm ngừng nhận gửi mới.' }, 403)
        const body = await readBody(request)
        const teamId = cleanText(body.teamId, 60)
        const email = cleanText(body.email, 120).toLowerCase()
        if (!/^[a-z0-9-]{2,60}$/.test(teamId)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Email chưa đúng dạng' }, 400)
        const team = await d.prepare('SELECT id FROM teams WHERE id = ?').bind(teamId).first()
        if (!team) return json({ error: 'Không thấy nhóm' }, 404)
        await d
          .prepare('INSERT OR IGNORE INTO subscribers(email, team_id) VALUES(?, ?)')
          .bind(email, teamId)
          .run()
        return json({ ok: true })
      },
    },
  },
})
