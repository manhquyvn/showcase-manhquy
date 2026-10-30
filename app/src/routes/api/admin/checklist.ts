import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isAdmin, json, logAudit, readBody, seedChecklist } from '../../../lib/server'

interface ChecklistRow { id: number; label: string; done: number; sort: number }

export const Route = createFileRoute('/api/admin/checklist')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const team = new URL(request.url).searchParams.get('team') ?? ''
        if (!/^[a-z0-9-]{2,60}$/.test(team)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        const d = await db()
        const teamRow = await d.prepare('SELECT id FROM teams WHERE id = ?').bind(team).first()
        if (!teamRow) return json({ error: 'Không thấy nhóm' }, 404)
        await seedChecklist(d, team)
        const items = await d
          .prepare('SELECT id, label, done, sort FROM checklist_items WHERE team_id = ? ORDER BY sort ASC, id ASC')
          .bind(team)
          .all<ChecklistRow>()
        return json({
          items: items.results.map((i) => ({ id: i.id, label: i.label, done: !!i.done, sort: i.sort })),
        })
      },
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        const action = body.action
        if (action !== 'add' && action !== 'toggle' && action !== 'delete') {
          return json({ error: 'Hành động không hợp lệ' }, 400)
        }
        const teamId = cleanText(body.teamId, 60)
        if (!/^[a-z0-9-]{2,60}$/.test(teamId)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        const d = await db()
        const teamRow = await d.prepare('SELECT id FROM teams WHERE id = ?').bind(teamId).first()
        if (!teamRow) return json({ error: 'Không thấy nhóm' }, 404)

        if (action === 'add') {
          const label = cleanText(body.label, 300)
          if (!label) return json({ error: 'Nhãn mục không được trống' }, 400)
          const maxRow = await d
            .prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM checklist_items WHERE team_id = ?')
            .bind(teamId)
            .first<{ m: number }>()
          const sort = (maxRow?.m ?? -1) + 1
          await d
            .prepare('INSERT INTO checklist_items(team_id, label, done, sort) VALUES(?, ?, 0, ?)')
            .bind(teamId, label, sort)
            .run()
          await logAudit(d, 'checklist.add', 'checklist', teamId, `label=${label}`)
          return json({ ok: true })
        }

        const id = Number(body.id)
        if (!Number.isInteger(id) || id <= 0) return json({ error: 'Mục không hợp lệ' }, 400)

        if (action === 'toggle') {
          let done: number
          if (typeof body.done === 'boolean') {
            done = body.done ? 1 : 0
          } else {
            const row = await d
              .prepare('SELECT done FROM checklist_items WHERE id = ? AND team_id = ?')
              .bind(id, teamId)
              .first<{ done: number }>()
            if (!row) return json({ error: 'Không thấy mục' }, 404)
            done = row.done ? 0 : 1
          }
          await d
            .prepare('UPDATE checklist_items SET done = ? WHERE id = ? AND team_id = ?')
            .bind(done, id, teamId)
            .run()
          await logAudit(d, 'checklist.toggle', 'checklist', String(id), `team=${teamId} done=${done}`)
          return json({ ok: true, done: !!done })
        }

        await d.prepare('DELETE FROM checklist_items WHERE id = ? AND team_id = ?').bind(id, teamId).run()
        await logAudit(d, 'checklist.delete', 'checklist', String(id), `team=${teamId}`)
        return json({ ok: true })
      },
    },
  },
})
