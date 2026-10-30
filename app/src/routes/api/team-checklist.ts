import { createFileRoute } from '@tanstack/react-router'
import { db, json } from '../../lib/server'

interface ChecklistRow { label: string; done: number }

export const Route = createFileRoute('/api/team-checklist')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const team = new URL(request.url).searchParams.get('team') ?? ''
        if (!/^[a-z0-9-]{2,60}$/.test(team)) return json({ error: 'team không hợp lệ' }, 400)
        const d = await db()
        let rows: ChecklistRow[] = []
        try {
          const items = await d
            .prepare('SELECT label, done FROM checklist_items WHERE team_id = ? ORDER BY sort ASC, id ASC')
            .bind(team)
            .all<ChecklistRow>()
          rows = items.results
        } catch {
          rows = []
        }
        const items = rows.map((i) => ({ label: i.label, done: !!i.done }))
        return json({
          items,
          done: items.filter((i) => i.done).length,
          total: items.length,
        })
      },
    },
  },
})
