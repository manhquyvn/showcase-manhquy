import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isAdmin, json, logAudit, readBody } from '../../../lib/server'

const LABELS = ['M0', 'M1', 'M2', 'M3', 'HP2', 'HP2+']

export const Route = createFileRoute('/api/admin/team')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        const id = cleanText(body.id, 60)
        if (!/^[a-z0-9-]{2,60}$/.test(id)) return json({ error: 'Nhóm không hợp lệ' }, 400)
        const statusText = cleanText(body.statusText, 200)
        const nextStep = cleanText(body.nextStep, 300)
        const updatedNote = cleanText(body.updatedNote, 200)
        const progress = Math.max(0, Math.min(6, Number(body.progressDone) || 0))
        const milestones = JSON.stringify(LABELS.slice(0, Math.min(progress, 4)))
        const d = await db()
        await d
          .prepare('UPDATE teams SET status_text = ?, next_step = ?, updated_note = ?, progress_done = ?, milestones = ? WHERE id = ?')
          .bind(statusText, nextStep, updatedNote, progress, milestones, id)
          .run()
        await logAudit(d, 'team.status', 'team', id, `progressDone=${progress} statusText=${statusText}`)
        return json({ ok: true })
      },
    },
  },
})
