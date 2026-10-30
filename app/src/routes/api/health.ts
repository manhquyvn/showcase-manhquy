import { createFileRoute } from '@tanstack/react-router'
import { db, json } from '../../lib/server'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const row = await (await db()).prepare('SELECT COUNT(*) AS n FROM teams').first<{ n: number }>()
          return json({ ok: true, db: true, teams: row?.n ?? 0 })
        } catch {
          return json({ ok: false, db: false }, 503)
        }
      },
    },
  },
})
