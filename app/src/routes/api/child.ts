import { createFileRoute } from '@tanstack/react-router'
import { db, json } from '../../lib/server'

interface TeamRow {
  id: string; name: string; field: string; classes: string; members: string
  summary: string; status_text: string; next_step: string; updated_note: string
  progress_done: number; milestones: string; sample: number
  demo_url: string; repo_url: string
  quote: string | null; upgrades: string | null; hue: string | null
  handover_status: string | null; handover_date: string | null; handover_note: string | null
}
interface ProductRow { name: string; price: number }
interface ChecklistRow { label: string; done: number }
interface TokenRow { team_id: string; nickname: string }

function parseStringArray(raw: string | null | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export const Route = createFileRoute('/api/child')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get('token') ?? ''
        if (!token) return json({ error: 'Thiếu mã truy cập' }, 404)
        const d = await db()
        const tokenRow = await d
          .prepare('SELECT team_id, nickname FROM child_tokens WHERE token = ? AND revoked = 0')
          .bind(token)
          .first<TokenRow>()
        if (!tokenRow) return json({ error: 'Không tìm thấy trang này' }, 404)

        const t = await d.prepare('SELECT * FROM teams WHERE id = ?').bind(tokenRow.team_id).first<TeamRow>()
        if (!t) return json({ error: 'Không tìm thấy trang này' }, 404)

        // Nhóm thật: trang riêng chỉ mở khi biệt danh đã có đồng ý trưng bày.
        if (!t.sample) {
          let consent: { status: string } | null = null
          try {
            consent = await d
              .prepare("SELECT status FROM consents WHERE team_id = ? AND nickname = ? AND scope = 'showcase'")
              .bind(t.id, tokenRow.nickname)
              .first<{ status: string }>()
          } catch {
            consent = null
          }
          if (consent?.status !== 'granted') return json({ error: 'Không tìm thấy trang này' }, 404)
        }

        const products = await d
          .prepare('SELECT name, price FROM products WHERE team_id = ? ORDER BY sort ASC')
          .bind(t.id)
          .all<ProductRow>()

        let checklistRows: ChecklistRow[] = []
        try {
          const rows = await d
            .prepare('SELECT label, done FROM checklist_items WHERE team_id = ? ORDER BY sort ASC, id ASC')
            .bind(t.id)
            .all<ChecklistRow>()
          checklistRows = rows.results
        } catch {
          checklistRows = []
        }
        const checklistItems = checklistRows.map((i) => ({ label: i.label, done: !!i.done }))
        const checklistDone = checklistItems.filter((i) => i.done).length

        const allMembers = parseStringArray(t.members)
        let members = allMembers
        if (!t.sample) {
          try {
            const granted = await d
              .prepare("SELECT nickname FROM consents WHERE team_id = ? AND status = 'granted' AND scope = 'showcase'")
              .bind(t.id)
              .all<{ nickname: string }>()
            const grantedSet = new Set(granted.results.map((c) => c.nickname))
            members = allMembers.filter((m) => grantedSet.has(m))
          } catch {
            members = []
          }
        }

        return json({
          nickname: tokenRow.nickname,
          team: {
            id: t.id,
            team: t.name,
            field: t.field,
            classes: t.classes,
            members,
            summary: t.summary,
            statusText: t.status_text,
            nextStep: t.next_step,
            updatedNote: t.updated_note,
            progressDone: t.progress_done,
            milestones: parseStringArray(t.milestones),
            sample: !!t.sample,
            quote: t.quote ?? '',
            upgrades: parseStringArray(t.upgrades),
            hue: t.hue ?? 'teal',
            demoUrl: t.demo_url,
            repoUrl: t.repo_url,
            handover: t.handover_status === 'returned'
              ? { status: 'returned' as const, date: t.handover_date ?? null, note: t.handover_note ?? '' }
              : null,
            checklist: { done: checklistDone, total: checklistItems.length },
            products: products.results.map((p) => ({ name: p.name, price: p.price })),
          },
          checklist: {
            items: checklistItems,
            done: checklistDone,
            total: checklistItems.length,
          },
        })
      },
    },
  },
})
