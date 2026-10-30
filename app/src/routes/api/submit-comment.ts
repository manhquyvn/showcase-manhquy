import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isFrozen, json, readBody } from '../../lib/server'

export const Route = createFileRoute('/api/submit-comment')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const d = await db()
        if (await isFrozen(d)) return json({ error: 'Trang đang ở chế độ đóng băng cuối khóa, tạm ngừng nhận gửi mới.' }, 403)
        const body = await readBody(request)
        const teamId = cleanText(body.teamId, 60)
        const author = cleanText(body.authorName, 60)
        const text = cleanText(body.text, 500)
        if (!/^[a-z0-9-]{2,60}$/.test(teamId)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        if (author.length < 2) return json({ error: 'Hãy ghi tên người gửi' }, 400)
        if (text.length < 2) return json({ error: 'Nội dung quá ngắn' }, 400)
        const team = await d.prepare('SELECT id FROM teams WHERE id = ?').bind(teamId).first()
        if (!team) return json({ error: 'Không thấy nhóm' }, 404)
        await d
          .prepare('INSERT INTO comments(team_id, author_name, text, status) VALUES(?, ?, ?, ?)')
          .bind(teamId, author, text, 'pending')
          .run()
        return json({ ok: true, state: 'pending' })
      },
    },
  },
})
