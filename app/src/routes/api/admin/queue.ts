import { createFileRoute } from '@tanstack/react-router'
import { db, isAdmin, json } from '../../../lib/server'

export const Route = createFileRoute('/api/admin/queue')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const d = await db()
        const pendingUpdates = await d
          .prepare("SELECT id, team_id, milestone, text, created_at FROM updates WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100")
          .all()
        const pendingComments = await d
          .prepare("SELECT id, team_id, author_name, text, created_at FROM comments WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100")
          .all()
        const teams = await d
          .prepare('SELECT id, name, status_text, next_step, updated_note, progress_done FROM teams ORDER BY created_at ASC')
          .all()
        const subscribers = await d.prepare('SELECT COUNT(*) AS n FROM subscribers').first<{ n: number }>()
        return json({
          pendingUpdates: pendingUpdates.results,
          pendingComments: pendingComments.results,
          pendingCount: pendingUpdates.results.length + pendingComments.results.length,
          teams: teams.results,
          subscriberCount: subscribers?.n ?? 0,
        })
      },
    },
  },
})
