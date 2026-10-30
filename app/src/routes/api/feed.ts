import { createFileRoute } from '@tanstack/react-router'
import { db, json } from '../../lib/server'

interface UpdateRow { id: number; milestone: string | null; text: string; pinned: number; created_at: string }
interface CommentRow { id: number; author_name: string; text: string; created_at: string }

export const Route = createFileRoute('/api/feed')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const team = new URL(request.url).searchParams.get('team') ?? ''
        if (!/^[a-z0-9-]{2,60}$/.test(team)) return json({ error: 'team không hợp lệ' }, 400)
        const d = await db()
        const updates = await d
          .prepare("SELECT id, milestone, text, pinned, created_at FROM updates WHERE team_id = ? AND status = 'approved' AND visibility = 'public' ORDER BY pinned DESC, created_at DESC LIMIT 50")
          .bind(team)
          .all<UpdateRow>()
        const comments = await d
          .prepare("SELECT id, author_name, text, created_at FROM comments WHERE team_id = ? AND status = 'approved' AND visibility = 'public' ORDER BY created_at DESC LIMIT 50")
          .bind(team)
          .all<CommentRow>()
        return json({ updates: updates.results, comments: comments.results })
      },
    },
  },
})
