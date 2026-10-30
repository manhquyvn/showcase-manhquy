import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isAdmin, json, logAudit, readBody } from '../../../lib/server'

interface ConsentRow { nickname: string; status: string; updated_at: string }

export const Route = createFileRoute('/api/admin/consents')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const team = new URL(request.url).searchParams.get('team') ?? ''
        if (!/^[a-z0-9-]{2,60}$/.test(team)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        const d = await db()
        const consents = await d
          .prepare("SELECT nickname, status, updated_at FROM consents WHERE team_id = ? AND scope = 'showcase' ORDER BY nickname ASC")
          .bind(team)
          .all<ConsentRow>()
        return json({
          consents: consents.results.map((c) => ({
            nickname: c.nickname,
            status: c.status,
            updated_at: c.updated_at,
          })),
        })
      },
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        const teamId = cleanText(body.teamId, 60)
        const nickname = cleanText(body.nickname, 60)
        if (!/^[a-z0-9-]{2,60}$/.test(teamId)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        if (!nickname) return json({ error: 'Biệt danh không được trống' }, 400)
        if (body.status !== 'granted' && body.status !== 'withdrawn') {
          return json({ error: 'Trạng thái đồng ý không hợp lệ' }, 400)
        }
        const status = body.status
        const d = await db()
        const team = await d.prepare('SELECT id FROM teams WHERE id = ?').bind(teamId).first()
        if (!team) return json({ error: 'Không thấy nhóm' }, 404)
        await d
          .prepare(
            "INSERT INTO consents(team_id, nickname, scope, status) VALUES(?, ?, 'showcase', ?) ON CONFLICT(team_id, nickname, scope) DO UPDATE SET status = excluded.status, updated_at = datetime('now')",
          )
          .bind(teamId, nickname, status)
          .run()
        await logAudit(d, 'consent.set', 'consent', teamId, `nickname=${nickname} status=${status}`)
        return json({ ok: true })
      },
    },
  },
})
