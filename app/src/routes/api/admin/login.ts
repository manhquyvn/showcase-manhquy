import { createFileRoute } from '@tanstack/react-router'
import { checkPassword, db, issueCookie, json, logAudit, readBody } from '../../../lib/server'

export const Route = createFileRoute('/api/admin/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await readBody(request)
        const password = typeof body.password === 'string' ? body.password : ''
        if (!(await checkPassword(password))) {
          return json({ error: 'Mật khẩu chưa đúng' }, 401)
        }
        await logAudit(await db(), 'login', 'session', '', '')
        return json({ ok: true }, 200, { 'Set-Cookie': await issueCookie() })
      },
    },
  },
})
