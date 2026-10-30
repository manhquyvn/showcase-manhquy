import { createFileRoute } from '@tanstack/react-router'
import { cleanText, db, isAdmin, isFrozen, json, logAudit, readBody, seedChecklist } from '../../../lib/server'

const LABELS = ['M0', 'M1', 'M2', 'M3', 'HP2', 'HP2+']
const ID_RE = /^[a-z0-9-]{2,60}$/

interface ProductInput { name: string; price: number }

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function cleanStringArray(v: unknown, maxItem: number, maxCount: number): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => cleanText(x, maxItem))
    .filter((x) => x.length > 0)
    .slice(0, maxCount)
}

function parseProducts(v: unknown): ProductInput[] {
  if (!Array.isArray(v)) return []
  const out: ProductInput[] = []
  for (const item of v.slice(0, 20)) {
    const rec = asRecord(item)
    if (!rec) continue
    const name = cleanText(rec.name, 200)
    if (!name) continue
    const price = Math.max(0, Math.floor(Number(rec.price) || 0))
    out.push({ name, price })
  }
  return out
}

function parseSample(v: unknown): number | null {
  if (v === undefined || v === null) return null
  if (v === true || v === 1 || v === '1') return 1
  if (v === false || v === 0 || v === '0') return 0
  return null
}

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

function parseStringArray(raw: string | null | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export const Route = createFileRoute('/api/admin/teams')({
  server: {
    handlers: {
      // Bản quản trị của /api/teams: cùng khuôn dữ liệu nhưng members KHÔNG
      // lọc theo sổ đồng ý. Form sửa nhóm phải nạp từ đây — nếu nạp từ
      // /api/teams công khai (đã lọc consent), khi lưu sẽ ghi đè và xoá mất
      // các biệt danh chưa có đồng ý khỏi danh sách gốc trong D1.
      GET: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const d = await db()
        const teams = await d.prepare('SELECT * FROM teams ORDER BY created_at ASC').all<TeamRow>()
        const products = await d.prepare('SELECT team_id, name, price FROM products ORDER BY sort ASC').all<ProductRow>()
        let checklistCounts: ChecklistCountRow[] = []
        try {
          const rows = await d
            .prepare('SELECT team_id, COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM checklist_items GROUP BY team_id')
            .all<ChecklistCountRow>()
          checklistCounts = rows.results
        } catch {
          checklistCounts = []
        }
        const frozen = await isFrozen(d)
        return json({
          teams: teams.results.map((t) => {
            const counts = checklistCounts.find((c) => c.team_id === t.id)
            return {
              id: t.id,
              team: t.name,
              field: t.field,
              classes: t.classes,
              members: parseStringArray(t.members),
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
      POST: async ({ request }) => {
        if (!(await isAdmin(request))) return json({ error: 'Chưa đăng nhập' }, 401)
        const body = await readBody(request)
        const action = body.action
        if (action !== 'create' && action !== 'update' && action !== 'delete') {
          return json({ error: 'Hành động không hợp lệ' }, 400)
        }
        const team = asRecord(body.team) ?? {}
        const id = cleanText(team.id ?? body.id, 60)
        if (!ID_RE.test(id)) return json({ error: 'Mã nhóm không hợp lệ' }, 400)

        const d = await db()
        const existing = await d.prepare('SELECT id, sample FROM teams WHERE id = ?').bind(id).first<{ id: string; sample: number }>()

        if (action === 'delete') {
          if (!existing) return json({ error: 'Không thấy nhóm' }, 404)
          for (const table of ['products', 'checklist_items', 'child_tokens', 'consents', 'updates', 'comments', 'subscribers']) {
            await d.prepare(`DELETE FROM ${table} WHERE team_id = ?`).bind(id).run()
          }
          await d.prepare('DELETE FROM teams WHERE id = ?').bind(id).run()
          await logAudit(d, 'teams.delete', 'team', id, '')
          return json({ ok: true, id })
        }

        const name = cleanText(team.name ?? team.team, 200)
        if (!name) return json({ error: 'Tên nhóm không được trống' }, 400)
        const field = cleanText(team.field, 200)
        const classes = cleanText(team.classes, 100)
        const members = cleanStringArray(team.members, 60, 12)
        const summary = cleanText(team.summary, 1000)
        const quote = cleanText(team.quote, 500)
        const upgrades = cleanStringArray(team.upgrades, 200, 10)
        const demoUrl = cleanText(team.demoUrl, 300) || '#'
        const repoUrl = cleanText(team.repoUrl, 300) || '#'
        const hue = cleanText(team.hue, 20) || 'teal'
        const statusText = cleanText(team.statusText, 200)
        const nextStep = cleanText(team.nextStep, 300)
        const updatedNote = cleanText(team.updatedNote, 200)
        const progressRaw = Number(team.progressDone)
        const progress = Number.isFinite(progressRaw) ? Math.max(0, Math.min(6, Math.floor(progressRaw))) : 0
        const milestones = JSON.stringify(LABELS.slice(0, Math.min(progress, 4)))
        const sample = parseSample(team.sample) ?? (action === 'create' ? 1 : (existing?.sample ?? 0))
        const products = parseProducts(team.products)

        if (action === 'create') {
          if (existing) return json({ error: 'Nhóm đã tồn tại' }, 409)
          await d
            .prepare(
              'INSERT INTO teams(id, name, field, classes, members, summary, status_text, next_step, updated_note, progress_done, milestones, demo_url, repo_url, sample, quote, upgrades, hue) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(id, name, field, classes, JSON.stringify(members), summary, statusText, nextStep, updatedNote, progress, milestones, demoUrl, repoUrl, sample, quote, JSON.stringify(upgrades), hue)
            .run()
          for (let i = 0; i < products.length; i++) {
            await d
              .prepare('INSERT INTO products(team_id, name, price, sort) VALUES(?, ?, ?, ?)')
              .bind(id, products[i].name, products[i].price, i)
              .run()
          }
          await seedChecklist(d, id)
          await logAudit(d, 'teams.create', 'team', id, `name=${name}`)
          return json({ ok: true, id })
        }

        // update
        if (!existing) return json({ error: 'Không thấy nhóm' }, 404)
        await d
          .prepare(
            'UPDATE teams SET name = ?, field = ?, classes = ?, members = ?, summary = ?, status_text = ?, next_step = ?, updated_note = ?, progress_done = ?, milestones = ?, demo_url = ?, repo_url = ?, sample = ?, quote = ?, upgrades = ?, hue = ? WHERE id = ?',
          )
          .bind(name, field, classes, JSON.stringify(members), summary, statusText, nextStep, updatedNote, progress, milestones, demoUrl, repoUrl, sample, quote, JSON.stringify(upgrades), hue, id)
          .run()
        await d.prepare('DELETE FROM products WHERE team_id = ?').bind(id).run()
        for (let i = 0; i < products.length; i++) {
          await d
            .prepare('INSERT INTO products(team_id, name, price, sort) VALUES(?, ?, ?, ?)')
            .bind(id, products[i].name, products[i].price, i)
            .run()
        }
        await logAudit(d, 'teams.update', 'team', id, `name=${name}`)
        return json({ ok: true, id })
      },
    },
  },
})
