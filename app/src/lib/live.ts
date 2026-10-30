import { useEffect, useState } from 'react'
import { SHOWCASE_DATA, type Exhibit, type Product } from '../data'

/**
 * Dữ liệu sống vòng 2: đọc từ D1 qua /api/teams (giáo viên sửa ở trang
 * quản trị là phụ huynh thấy ngay, không cần build lại).
 * Khởi tạo bằng dữ liệu mẫu trong data.ts (seed) để trang có nội dung
 * ngay; fetch xong thì thay bằng dữ liệu API. Fetch lỗi thì giữ seed.
 */

export interface Handover {
  status: 'returned'
  date: string | null
  note: string
}

export interface ChecklistSummary {
  done: number
  total: number
}

export interface TeamExtra {
  handover: Handover | null
  checklist: ChecklistSummary
}

export interface ApiTeam {
  id: string
  team: string
  field?: string
  classes?: string
  members?: string[]
  summary?: string
  quote?: string
  upgrades?: string[]
  demoUrl?: string
  repoUrl?: string
  hue?: string
  statusText?: string
  nextStep?: string
  updatedNote?: string
  progressDone?: number
  milestones?: string[]
  sample?: boolean
  products?: Product[]
  handover?: Handover | null
  checklist?: ChecklistSummary
}

export function mapApiTeam(t: ApiTeam): Exhibit {
  return {
    id: t.id,
    team: t.team,
    field: t.field ?? '',
    classes: t.classes ?? '',
    members: Array.isArray(t.members) ? t.members : [],
    summary: t.summary ?? '',
    milestones: Array.isArray(t.milestones) ? t.milestones : [],
    upgrades: Array.isArray(t.upgrades) ? t.upgrades : [],
    quote: t.quote ?? '',
    demoUrl: t.demoUrl ?? '#',
    repoUrl: t.repoUrl ?? '#',
    hue: t.hue || 'teal',
    sample: !!t.sample,
    progressDone: typeof t.progressDone === 'number' ? t.progressDone : 0,
    statusText: t.statusText ?? '',
    nextStep: t.nextStep ?? '',
    updatedNote: t.updatedNote ?? '',
    products: Array.isArray(t.products) ? t.products : [],
  }
}

export interface LiveExhibits {
  exhibits: Exhibit[]
  extras: Record<string, TeamExtra>
  loaded: boolean
  frozen: boolean
}

export function useLiveExhibits(): LiveExhibits {
  const [exhibits, setExhibits] = useState<Exhibit[]>(SHOWCASE_DATA.exhibits)
  const [extras, setExtras] = useState<Record<string, TeamExtra>>({})
  const [loaded, setLoaded] = useState(false)
  const [frozen, setFrozen] = useState(false)

  useEffect(() => {
    let on = true
    fetch('/api/teams')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!on) return
        if (d && Array.isArray(d.teams)) {
          const teams = d.teams as ApiTeam[]
          setExhibits(teams.map(mapApiTeam))
          const next: Record<string, TeamExtra> = {}
          for (const t of teams) {
            next[t.id] = {
              handover: t.handover ?? null,
              checklist: t.checklist ?? { done: 0, total: 0 },
            }
          }
          setExtras(next)
          setFrozen(!!d.site?.frozen)
        }
        setLoaded(true)
      })
      .catch(() => {
        if (on) setLoaded(true)
      })
    return () => {
      on = false
    }
  }, [])

  return { exhibits, extras, loaded, frozen }
}

export interface ChecklistItem {
  label: string
  done: boolean
}

export interface TeamChecklist {
  items: ChecklistItem[]
  done: number
  total: number
  loaded: boolean
}

export function useTeamChecklist(teamId: string): TeamChecklist {
  const [state, setState] = useState<Omit<TeamChecklist, 'loaded'>>({
    items: [],
    done: 0,
    total: 0,
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!teamId) return
    let on = true
    setLoaded(false)
    fetch(`/api/team-checklist?team=${encodeURIComponent(teamId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!on) return
        if (d) {
          const items = (Array.isArray(d.items) ? d.items : []) as ChecklistItem[]
          setState({
            items,
            done: typeof d.done === 'number' ? d.done : items.filter((i) => i.done).length,
            total: typeof d.total === 'number' ? d.total : items.length,
          })
        }
        setLoaded(true)
      })
      .catch(() => {
        if (on) setLoaded(true)
      })
    return () => {
      on = false
    }
  }, [teamId])

  return { ...state, loaded }
}
