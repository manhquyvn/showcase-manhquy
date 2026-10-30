import { createFileRoute } from '@tanstack/react-router'
import { clearCookie, json } from '../../../lib/server'

export const Route = createFileRoute('/api/admin/logout')({
  server: {
    handlers: {
      POST: async () => json({ ok: true }, 200, { 'Set-Cookie': clearCookie() }),
    },
  },
})
