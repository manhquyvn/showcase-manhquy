import { createFileRoute } from '@tanstack/react-router'
import { db, isFrozen, json } from '../../lib/server'

interface TeamRow {
  id: string; name: string; field: string; classes: string; members: string
  summary: string; status_text: string; next_step: string; updated_note: string
  progress_done: number; milestones: string; sample: number
  demo_url: string; repo_url: string
  quote: string | null; upgrades: string | null; hue: string | null
  handover_status: string | null; handover_date: string | null; handover_note: string | null
}
interface ProductRow { team_id: string; name: string; price: number }
interface ChecklistCountRow { team_id: string; total: number; done: number }
interface ConsentRow { team_id: string; nickname: string }

function parseStringArray(raw: string | null | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export const Route = createFileRoute('/api/teams')({
  server: {
    handlers: {
      GET: async () => {
        const d = await db()
        const teams = await d.prepare('SELECT * FROM teams ORDER BY created_at ASC').all<TeamRow>()
        const products = await d.prepare('SELECT team_id, name, price FROM products ORDER BY sort ASC').all<ProductRow>()

        // Các bảng vòng 2 (migration 0003): nếu chưa áp ở môi trường đang chạy
        // thì dùng giá trị rỗng thay vì làm gãy endpoint công khai.
        let checklistCounts: ChecklistCountRow[] = []
        try {
          const rows = await d
            .prepare('SELECT team_id, COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM checklist_items GROUP BY team_id')
            .all<ChecklistCountRow>()
          checklistCounts = rows.results
        } catch {
          checklistCounts = []
        }
        let grantedConsents: ConsentRow[] = []
        try {
          const rows = await d
            .prepare("SELECT team_id, nickname FROM consents WHERE status = 'granted' AND scope = 'showcase'")
            .all<ConsentRow>()
          grantedConsents = rows.results
        } catch {
          grantedConsents = []
        }

        const frozen = await isFrozen(d)

        return json({
          teams: teams.results.map((t) => {
            const allMembers = parseStringArray(t.members)
            const granted = new Set(
              grantedConsents.filter((c) => c.team_id === t.id).map((c) => c.nickname),
            )
            // Nhóm mẫu giữ nguyên danh sách; nhóm thật chỉ hiện biệt danh
            // đã có đồng ý trưng bày (consent granted, scope showcase).
            const members = t.sample ? allMembers : allMembers.filter((m) => granted.has(m))
            const counts = checklistCounts.find((c) => c.team_id === t.id)
            return {
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
              checklist: { done: Number(counts?.done ?? 0), total: Number(counts?.total ?? 0) },
              products: products.results.filter((p) => p.team_id === t.id).map((p) => ({ name: p.name, price: p.price })),
            }
          }),
          site: { frozen },
        })
      },
    },
  },
})
