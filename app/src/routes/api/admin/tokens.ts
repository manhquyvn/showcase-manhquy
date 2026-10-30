import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isAdmin, json, logAudit, readBody } from '../../../lib/server'

interface TokenRow { token: string; nickname: string; created_at: string; revoked: number }

export const Route = createFileRoute('/api/admin/tokens')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const team = new URL(request.url).searchParams.get('team') ?? ''
        if (!/^[a-z0-9-]{2,60}$/.test(team)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        const d = await db()
        const tokens = await d
          .prepare('SELECT token, nickname, created_at, revoked FROM child_tokens WHERE team_id = ? ORDER BY created_at DESC')
          .bind(team)
          .all<TokenRow>()
        return json({
          tokens: tokens.results.map((t) => ({
            token: t.token,
            nickname: t.nickname,
            created_at: t.created_at,
            revoked: !!t.revoked,
          })),
        })
      },
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        const d = await db()

        if (body.action === 'create') {
          const teamId = cleanText(body.teamId, 60)
          const nickname = cleanText(body.nickname, 60)
          if (!/^[a-z0-9-]{2,60}$/.test(teamId)) return json({ error: 'Nhóm không hợp lệ' }, 400)
          if (!nickname) return json({ error: 'Biệt danh không được trống' }, 400)
          const team = await d.prepare('SELECT id FROM teams WHERE id = ?').bind(teamId).first()
          if (!team) return json({ error: 'Không thấy nhóm' }, 404)
          const bytes = new Uint8Array(16)
          crypto.getRandomValues(bytes)
          const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
          await d
            .prepare('INSERT INTO child_tokens(token, team_id, nickname) VALUES(?, ?, ?)')
            .bind(token, teamId, nickname)
            .run()
          await logAudit(d, 'token.create', 'child_token', token, `team=${teamId} nickname=${nickname}`)
          return json({ ok: true, token, path: `/be/${token}` })
        }

        if (body.action === 'revoke') {
          const token = cleanText(body.token, 64)
          if (!/^[a-f0-9]{32}$/.test(token)) return json({ error: 'Token không hợp lệ' }, 400)
          await d.prepare('UPDATE child_tokens SET revoked = 1 WHERE token = ?').bind(token).run()
          await logAudit(d, 'token.revoke', 'child_token', token, '')
          return json({ ok: true })
        }

        return json({ error: 'Hành động không hợp lệ' }, 400)
      },
    },
  },
})
