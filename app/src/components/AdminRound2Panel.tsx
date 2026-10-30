import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiTeam, Handover } from '../lib/live'

/**
 * Phân hệ quản trị vòng 2: ghi thẳng vào hệ thống (D1) qua /api/admin/*.
 * Nhóm và sản phẩm, checklist sẵn sàng, bàn giao cuối khóa, link riêng
 * từng bé (chỉ biệt danh), sổ đồng ý phụ huynh, nhật ký kiểm toán và
 * đóng băng cuối khóa. Không còn bản soạn localStorage hay xuất file.
 */

const LABELS = ['M0', 'M1', 'M2', 'M3', 'HP2', 'HP2+']

function slugify(text: string): string {
  return text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function lines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function memberLines(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function apiJson(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const r = await fetch(path, init)
  const d = (await r.json().catch(() => ({}))) as Record<string, unknown>
  if (!r.ok) {
    throw new Error(typeof d.error === 'string' ? d.error : `Yêu cầu chưa thành công (${r.status})`)
  }
  return d
}

function postJson(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

interface TeamForm {
  id: string
  name: string
  field: string
  classes: string
  membersText: string
  summary: string
  quote: string
  upgradesText: string
  demoUrl: string
  repoUrl: string
  hue: string
  statusText: string
  nextStep: string
  updatedNote: string
  progressDone: number
  sample: boolean
  products: { name: string; price: number }[]
}

const EMPTY_FORM: TeamForm = {
  id: '',
  name: '',
  field: '',
  classes: '',
  membersText: '',
  summary: '',
  quote: '',
  upgradesText: '',
  demoUrl: '',
  repoUrl: '',
  hue: 'teal',
  statusText: '',
  nextStep: '',
  updatedNote: '',
  progressDone: 0,
  sample: true,
  products: [],
}

function formFromTeam(t: ApiTeam): TeamForm {
  return {
    id: t.id,
    name: t.team,
    field: t.field ?? '',
    classes: t.classes ?? '',
    membersText: (t.members ?? []).join('\n'),
    summary: t.summary ?? '',
    quote: t.quote ?? '',
    upgradesText: (t.upgrades ?? []).join('\n'),
    demoUrl: t.demoUrl && t.demoUrl !== '#' ? t.demoUrl : '',
    repoUrl: t.repoUrl && t.repoUrl !== '#' ? t.repoUrl : '',
    hue: t.hue || 'teal',
    statusText: t.statusText ?? '',
    nextStep: t.nextStep ?? '',
    updatedNote: t.updatedNote ?? '',
    progressDone: t.progressDone ?? 0,
    sample: !!t.sample,
    products: (t.products ?? []).map((p) => ({ ...p })),
  }
}

interface AdminChecklistItem { id: number; label: string; done: boolean; sort: number }
interface TokenRow { token: string; nickname: string; created_at: string; revoked: boolean }
interface ConsentRow { nickname: string; status: string; updated_at: string }
interface AuditEntry {
  id: number; ts: string; action: string; target_type: string; target_id: string; detail: string
}

export function AdminRound2Panel() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [teams, setTeams] = useState<ApiTeam[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM)
  const [teamMsg, setTeamMsg] = useState('')

  const [checkItems, setCheckItems] = useState<AdminChecklistItem[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [checkMsg, setCheckMsg] = useState('')

  const [handoverDate, setHandoverDate] = useState('')
  const [handoverNote, setHandoverNote] = useState('')
  const [handoverMsg, setHandoverMsg] = useState('')

  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [tokenNickname, setTokenNickname] = useState('')
  const [createdLink, setCreatedLink] = useState('')
  const [tokenMsg, setTokenMsg] = useState('')

  const [consents, setConsents] = useState<ConsentRow[]>([])
  const [consentMsg, setConsentMsg] = useState('')

  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [frozen, setFrozen] = useState<boolean | null>(null)
  const [frozenAt, setFrozenAt] = useState<string | null>(null)
  const [snapshotKey, setSnapshotKey] = useState('')
  const [freezeMsg, setFreezeMsg] = useState('')

  const selectedTeam = teams.find((t) => t.id === selectedId) ?? null
  const currentHandover: Handover | null = selectedTeam?.handover ?? null

  // ---- Đăng nhập: kiểm tra qua hàng chờ; chưa đăng nhập thì thử lại
  // định kỳ để panel tự hiện sau khi giáo viên đăng nhập ở khung trên.
  const checkAuth = useCallback(() => {
    fetch('/api/admin/queue')
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false))
  }, [])

  useEffect(() => {
    checkAuth()
    if (authed === true) return
    const iv = setInterval(checkAuth, 5000)
    return () => clearInterval(iv)
  }, [checkAuth, authed])

  // ---- Tải phụ theo nhóm
  const loadChecklist = useCallback(async (teamId: string) => {
    try {
      const d = await apiJson(`/api/admin/checklist?team=${encodeURIComponent(teamId)}`)
      setCheckItems((d.items as AdminChecklistItem[]) ?? [])
    } catch {
      setCheckItems([])
    }
  }, [])

  const loadTokens = useCallback(async (teamId: string) => {
    try {
      const d = await apiJson(`/api/admin/tokens?team=${encodeURIComponent(teamId)}`)
      setTokens((d.tokens as TokenRow[]) ?? [])
    } catch {
      setTokens([])
    }
  }, [])

  const loadConsents = useCallback(async (teamId: string) => {
    try {
      const d = await apiJson(`/api/admin/consents?team=${encodeURIComponent(teamId)}`)
      setConsents((d.consents as ConsentRow[]) ?? [])
    } catch {
      setConsents([])
    }
  }, [])

  const loadSub = useCallback(
    (teamId: string) => {
      void loadChecklist(teamId)
      void loadTokens(teamId)
      void loadConsents(teamId)
    },
    [loadChecklist, loadTokens, loadConsents],
  )

  const loadAudit = useCallback(async () => {
    try {
      const d = await apiJson('/api/admin/audit?limit=50')
      setAudit((d.entries as AuditEntry[]) ?? [])
    } catch {
      setAudit([])
    }
  }, [])

  const loadFreeze = useCallback(async () => {
    try {
      const d = await apiJson('/api/admin/freeze')
      setFrozen(!!d.frozen)
      setFrozenAt(typeof d.frozenAt === 'string' ? d.frozenAt : null)
    } catch {
      setFrozen(null)
    }
  }, [])

  const selectTeam = useCallback(
    (id: string, list: ApiTeam[]) => {
      const t = list.find((x) => x.id === id)
      if (!t) return
      setIsNew(false)
      setSelectedId(id)
      setForm(formFromTeam(t))
      setHandoverDate(t.handover?.date ?? '')
      setHandoverNote(t.handover?.note ?? '')
      setCreatedLink('')
      loadSub(id)
    },
    [loadSub],
  )

  const initialised = useRef(false)
  const loadTeams = useCallback(async () => {
    // Bắt buộc nạp từ /api/admin/teams (members đầy đủ, chưa lọc đồng ý).
    // /api/teams công khai đã lọc theo sổ đồng ý: nạp từ đó rồi lưu lại
    // sẽ xoá mất biệt danh chưa có đồng ý khỏi danh sách gốc trong D1.
    const d = await apiJson('/api/admin/teams')
    const list = (d.teams as ApiTeam[]) ?? []
    setTeams(list)
    return list
  }, [])

  useEffect(() => {
    if (authed !== true || initialised.current) return
    initialised.current = true
    void (async () => {
      try {
        const list = await loadTeams()
        if (list.length > 0) selectTeam(list[0].id, list)
      } catch {
        /* giữ danh sách rỗng */
      }
      void loadAudit()
      void loadFreeze()
    })()
  }, [authed, loadTeams, selectTeam, loadAudit, loadFreeze])

  if (authed === null) {
    return <p className="adm-note">Đang kiểm tra đăng nhập…</p>
  }
  if (!authed) {
    return (
      <p className="adm-note">
        Đăng nhập ở khung trên để dùng các phân hệ dưới đây.
      </p>
    )
  }

  const set = (p: Partial<TeamForm>) => setForm((f) => ({ ...f, ...p }))
  const hasTeam = !isNew && !!selectedId

  const startNew = () => {
    setIsNew(true)
    setSelectedId('')
    setForm({ ...EMPTY_FORM })
    setCheckItems([])
    setTokens([])
    setConsents([])
    setTeamMsg('Đang tạo nhóm mới: nhập tên nhóm, mã nhóm sẽ tự sinh từ tên.')
  }

  const saveTeam = async () => {
    const id = isNew ? slugify(form.name) : form.id
    if (!id) {
      setTeamMsg('Tên nhóm chưa hợp lệ để sinh mã nhóm.')
      return
    }
    try {
      await postJson('/api/admin/teams', {
        action: isNew ? 'create' : 'update',
        team: {
          id,
          name: form.name,
          field: form.field,
          classes: form.classes,
          members: memberLines(form.membersText),
          summary: form.summary,
          quote: form.quote,
          upgrades: lines(form.upgradesText),
          demoUrl: form.demoUrl.trim() || '#',
          repoUrl: form.repoUrl.trim() || '#',
          hue: form.hue.trim() || 'teal',
          statusText: form.statusText,
          nextStep: form.nextStep,
          updatedNote: form.updatedNote,
          progressDone: form.progressDone,
          sample: form.sample,
          products: form.products,
        },
      })
      setTeamMsg(`Đã ghi nhóm ${form.name} lên hệ thống, phụ huynh thấy ngay.`)
      const list = await loadTeams()
      selectTeam(id, list)
    } catch (e) {
      setTeamMsg(e instanceof Error ? e.message : 'Lưu chưa thành công.')
    }
  }

  const deleteTeam = async () => {
    if (!selectedTeam) return
    if (!window.confirm(`Xoá hẳn nhóm ${selectedTeam.team} khỏi hệ thống? Thao tác này không khôi phục được.`)) return
    try {
      await postJson('/api/admin/teams', {
        action: 'delete',
        team: { id: selectedTeam.id, name: selectedTeam.team },
      })
      setTeamMsg(`Đã xoá nhóm ${selectedTeam.team} khỏi hệ thống.`)
      initialised.current = false
      const list = await loadTeams()
      if (list.length > 0) selectTeam(list[0].id, list)
      else {
        setSelectedId('')
        setForm({ ...EMPTY_FORM })
      }
    } catch (e) {
      setTeamMsg(e instanceof Error ? e.message : 'Xoá chưa thành công.')
    }
  }

  // ---- Checklist
  const addChecklist = async () => {
    if (!hasTeam || !newLabel.trim()) return
    try {
      await postJson('/api/admin/checklist', { action: 'add', teamId: selectedId, label: newLabel.trim() })
      setNewLabel('')
      setCheckMsg('Đã thêm mục kiểm tra.')
      void loadChecklist(selectedId)
    } catch (e) {
      setCheckMsg(e instanceof Error ? e.message : 'Thêm chưa thành công.')
    }
  }
  const toggleChecklist = async (item: AdminChecklistItem) => {
    try {
      await postJson('/api/admin/checklist', {
        action: 'toggle', teamId: selectedId, id: item.id, done: !item.done,
      })
      void loadChecklist(selectedId)
    } catch (e) {
      setCheckMsg(e instanceof Error ? e.message : 'Đổi trạng thái chưa thành công.')
    }
  }
  const deleteChecklist = async (item: AdminChecklistItem) => {
    try {
      await postJson('/api/admin/checklist', { action: 'delete', teamId: selectedId, id: item.id })
      void loadChecklist(selectedId)
    } catch (e) {
      setCheckMsg(e instanceof Error ? e.message : 'Xoá chưa thành công.')
    }
  }

  // ---- Bàn giao
  const setHandover = async (returned: boolean) => {
    if (!hasTeam) return
    try {
      await postJson('/api/admin/handover', returned
        ? { teamId: selectedId, status: 'returned', date: handoverDate, note: handoverNote }
        : { teamId: selectedId, status: 'not_returned' })
      setHandoverMsg(returned ? 'Đã ghi nhận bàn giao cho nhóm.' : 'Đã gỡ trạng thái bàn giao.')
      const list = await loadTeams()
      const t = list.find((x) => x.id === selectedId)
      if (t) {
        setHandoverDate(t.handover?.date ?? '')
        setHandoverNote(t.handover?.note ?? '')
      }
    } catch (e) {
      setHandoverMsg(e instanceof Error ? e.message : 'Ghi bàn giao chưa thành công.')
    }
  }

  // ---- Token từng bé
  const createToken = async () => {
    if (!hasTeam || !tokenNickname) {
      setTokenMsg('Chọn một biệt danh trong nhóm trước.')
      return
    }
    try {
      const d = await postJson('/api/admin/tokens', {
        action: 'create', teamId: selectedId, nickname: tokenNickname,
      })
      const path = typeof d.path === 'string' ? d.path : `/be/${String(d.token ?? '')}`
      const full = path.startsWith('http')
        ? path
        : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
      setCreatedLink(full)
      setTokenMsg('Đã tạo link riêng. Sao chép đường dẫn dưới đây và gửi cho phụ huynh của bé.')
      void loadTokens(selectedId)
    } catch (e) {
      setTokenMsg(e instanceof Error ? e.message : 'Tạo link chưa thành công.')
    }
  }
  const revokeToken = async (row: TokenRow) => {
    if (!window.confirm(`Thu hồi link riêng của ${row.nickname}? Phụ huynh mở link này sẽ thấy thông báo hết hiệu lực.`)) return
    try {
      await postJson('/api/admin/tokens', { action: 'revoke', token: row.token })
      setTokenMsg(`Đã thu hồi link của ${row.nickname}.`)
      void loadTokens(selectedId)
    } catch (e) {
      setTokenMsg(e instanceof Error ? e.message : 'Thu hồi chưa thành công.')
    }
  }

  // ---- Sổ đồng ý
  const setConsent = async (nickname: string, status: 'granted' | 'withdrawn') => {
    if (!hasTeam) return
    try {
      await postJson('/api/admin/consents', { teamId: selectedId, nickname, status })
      setConsentMsg(
        status === 'granted'
          ? `Đã ghi nhận đồng ý cho ${nickname}.`
          : `Đã rút đồng ý của ${nickname}. Biệt danh này sẽ không còn hiện công khai nếu nhóm không phải nhóm mẫu.`,
      )
      void loadConsents(selectedId)
    } catch (e) {
      setConsentMsg(e instanceof Error ? e.message : 'Ghi sổ đồng ý chưa thành công.')
    }
  }
  const consentStatusByNick = new Map(consents.map((c) => [c.nickname, c]))
  const consentNicknames = Array.from(
    new Set([...(selectedTeam?.members ?? []), ...consents.map((c) => c.nickname)]),
  )

  // ---- Đóng băng
  const setFreeze = async (next: boolean) => {
    if (next && !window.confirm('Đóng băng cuối khóa? Trang sẽ chuyển sang chế độ lưu trữ: phụ huynh vẫn xem được mọi nội dung nhưng không gửi thêm cập nhật, lời động viên hay đăng ký email.')) return
    try {
      const d = await postJson('/api/admin/freeze', { frozen: next })
      setFrozen(next)
      if (typeof d.snapshotKey === 'string' && d.snapshotKey) {
        setSnapshotKey(d.snapshotKey)
        setFreezeMsg(`Đã đóng băng cuối khóa. Bản chụp lưu trữ: ${d.snapshotKey}`)
      } else {
        setFreezeMsg(next ? 'Đã đóng băng cuối khóa.' : 'Đã mở băng. Trang nhận gửi nội dung trở lại như bình thường.')
      }
      void loadFreeze()
    } catch (e) {
      setFreezeMsg(e instanceof Error ? e.message : 'Đổi trạng thái đóng băng chưa thành công.')
    }
  }

  return (
    <>
      {/* 1) Nhóm và sản phẩm */}
      <div className="adm-card">
        <h3>Nhóm và sản phẩm (ghi thẳng hệ thống)</h3>
        <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
          Lưu tại đây là ghi thẳng vào cơ sở dữ liệu: phụ huynh thấy ngay,
          không qua file hay pull request.
        </p>
        <div className="adm-actions" style={{ marginTop: 14 }}>
          <div className="adm-field" style={{ minWidth: 240 }}>
            <label>Chọn nhóm</label>
            <select
              value={isNew ? '' : selectedId}
              onChange={(e) => selectTeam(e.target.value, teams)}
              className="adm-select"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.team} ({t.id})
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn plain" onClick={startNew}>
            Nhóm mới
          </button>
        </div>

        <div className="adm-grid">
          <div className="adm-field">
            <label>Tên nhóm</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                set(isNew ? { name: e.target.value, id: slugify(e.target.value) } : { name: e.target.value })
              }
            />
          </div>
          <div className="adm-field">
            <label>Mã nhóm (địa chỉ trang: /du-an/{form.id || '...'})</label>
            <input type="text" value={form.id} readOnly={!isNew}
              onChange={(e) => set({ id: slugify(e.target.value) })} />
          </div>
          <div className="adm-field">
            <label>Lĩnh vực dự án</label>
            <input type="text" value={form.field} onChange={(e) => set({ field: e.target.value })} />
          </div>
          <div className="adm-field">
            <label>Lớp của các thành viên</label>
            <input type="text" value={form.classes} onChange={(e) => set({ classes: e.target.value })} />
          </div>
          <div className="adm-field full">
            <label>Biệt danh thành viên, mỗi dòng một biệt danh (chỉ biệt danh, không họ tên)</label>
            <textarea value={form.membersText} onChange={(e) => set({ membersText: e.target.value })} />
          </div>
          <div className="adm-field full">
            <label>Mô tả dự án</label>
            <textarea value={form.summary} onChange={(e) => set({ summary: e.target.value })} />
          </div>
          <div className="adm-field full">
            <label>Câu tổng kết của nhóm</label>
            <textarea value={form.quote} onChange={(e) => set({ quote: e.target.value })} />
          </div>
          <div className="adm-field full">
            <label>Nâng cấp nhóm đã làm, mỗi dòng một mục</label>
            <textarea value={form.upgradesText} onChange={(e) => set({ upgradesText: e.target.value })} />
          </div>
          <div className="adm-field">
            <label>Đường dẫn sản phẩm đang chạy (demo), để trống nếu chưa có</label>
            <input type="text" value={form.demoUrl} onChange={(e) => set({ demoUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="adm-field">
            <label>Đường dẫn kho mã (repo), để trống nếu chưa có</label>
            <input type="text" value={form.repoUrl} onChange={(e) => set({ repoUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="adm-field">
            <label>Màu gian trưng bày (hue)</label>
            <input type="text" value={form.hue} onChange={(e) => set({ hue: e.target.value })} placeholder="teal, blue, green..." />
          </div>
          <div className="adm-field">
            <label>Tình trạng hiện tại</label>
            <input type="text" value={form.statusText} onChange={(e) => set({ statusText: e.target.value })} />
          </div>
          <div className="adm-field">
            <label>Ghi chú lần cập nhật</label>
            <input type="text" value={form.updatedNote} onChange={(e) => set({ updatedNote: e.target.value })} />
          </div>
          <div className="adm-field full">
            <label>Bước tiếp theo</label>
            <input type="text" value={form.nextStep} onChange={(e) => set({ nextStep: e.target.value })} />
          </div>
          <div className="adm-field full">
            <label>
              Tiến độ: đã qua {form.progressDone} / 6 chặng (
              {LABELS.slice(0, form.progressDone).join(', ') || 'chưa qua chặng nào'})
            </label>
            <input type="range" min={0} max={6} step={1} value={form.progressDone}
              onChange={(e) => set({ progressDone: Number(e.target.value) })} />
          </div>
          <div className="adm-field">
            <label>
              <input type="checkbox" checked={form.sample}
                onChange={(e) => set({ sample: e.target.checked })} />{' '}
              Dữ liệu mẫu (gian trưng bày mẫu, chưa phải dữ liệu thật của nhóm)
            </label>
          </div>
        </div>

        <div className="adm-prods">
          <p style={{ fontWeight: 600, fontSize: 14.5 }}>Sản phẩm của cửa hàng dùng thử</p>
          {form.products.map((p, i) => (
            <div className="adm-prod-row" key={i}>
              <input type="text" value={p.name} aria-label="Tên sản phẩm"
                onChange={(e) => set({ products: form.products.map((q, j) => (j === i ? { ...q, name: e.target.value } : q)) })} />
              <input type="number" value={p.price} aria-label="Giá sản phẩm"
                onChange={(e) => set({ products: form.products.map((q, j) => (j === i ? { ...q, price: Number(e.target.value) } : q)) })} />
              <button type="button" className="adm-x" aria-label="Xóa sản phẩm"
                onClick={() => set({ products: form.products.filter((_, j) => j !== i) })}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn plain" style={{ marginTop: 12 }}
            onClick={() => set({ products: [...form.products, { name: 'Sản phẩm mới', price: 50000 }] })}>
            Thêm sản phẩm
          </button>
        </div>

        <div className="adm-actions">
          <button type="button" className="btn primary" onClick={saveTeam}>
            {isNew ? 'Tạo nhóm trên hệ thống' : 'Lưu lên hệ thống'}
          </button>
          {hasTeam && (
            <button type="button" className="btn plain" onClick={deleteTeam}>
              Xoá nhóm
            </button>
          )}
        </div>
        {teamMsg && <p className="adm-note" role="status">{teamMsg}</p>}
        {!isNew && (
          <p className="adm-note">
            Sau khi lưu, thay đổi đã ghi lên hệ thống, phụ huynh thấy ngay khi
            mở trang của nhóm.
          </p>
        )}
      </div>

      {/* 2) Checklist */}
      <div className="adm-card">
        <h3>Checklist sẵn sàng{selectedTeam ? ` — ${selectedTeam.team}` : ''}</h3>
        {!hasTeam ? (
          <p className="adm-note">Chọn một nhóm đã lưu ở khung trên để sửa checklist của nhóm đó.</p>
        ) : (
          <>
            {checkItems.length === 0 && <p className="adm-note">Chưa có mục nào. Thêm mục đầu tiên ở ô dưới đây.</p>}
            {checkItems.map((item) => (
              <div className="adm-prod-row adm-check-row" key={item.id}>
                <label>
                  <input type="checkbox" checked={item.done} onChange={() => toggleChecklist(item)} />{' '}
                  {item.label}
                </label>
                <span className="mono" style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>
                  {item.done ? 'Đã xong' : 'Chưa xong'}
                </span>
                <button type="button" className="adm-x" aria-label={`Xoá mục ${item.label}`}
                  onClick={() => deleteChecklist(item)}>
                  ×
                </button>
              </div>
            ))}
            <div className="adm-grid" style={{ marginTop: 14 }}>
              <div className="adm-field">
                <label>Mục kiểm tra mới</label>
                <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void addChecklist() }} />
              </div>
              <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn primary" onClick={addChecklist}>Thêm mục</button>
              </div>
            </div>
            {checkMsg && <p className="adm-note" role="status">{checkMsg}</p>}
          </>
        )}
      </div>

      {/* 3) Bàn giao */}
      <div className="adm-card">
        <h3>Bàn giao cuối khóa{selectedTeam ? ` — ${selectedTeam.team}` : ''}</h3>
        {!hasTeam ? (
          <p className="adm-note">Chọn một nhóm đã lưu ở khung trên để ghi bàn giao.</p>
        ) : (
          <>
            <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
              Trạng thái hiện tại:{' '}
              {currentHandover
                ? `Đã bàn giao${currentHandover.date ? ` ngày ${currentHandover.date}` : ''}${currentHandover.note ? ` — ${currentHandover.note}` : ''}`
                : 'Chưa bàn giao.'}
            </p>
            <div className="adm-grid">
              <div className="adm-field">
                <label>Ngày bàn giao</label>
                <input type="date" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)} className="adm-date" />
              </div>
              <div className="adm-field">
                <label>Ghi chú bàn giao</label>
                <input type="text" value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} />
              </div>
            </div>
            <div className="adm-actions">
              <button type="button" className="btn primary" onClick={() => setHandover(true)}>
                Đặt “Đã bàn giao”
              </button>
              {currentHandover && (
                <button type="button" className="btn plain" onClick={() => setHandover(false)}>
                  Gỡ bàn giao
                </button>
              )}
            </div>
            {handoverMsg && <p className="adm-note" role="status">{handoverMsg}</p>}
          </>
        )}
      </div>

      {/* 4) Link riêng từng bé */}
      <div className="adm-card">
        <h3>Link riêng từng bé{selectedTeam ? ` — ${selectedTeam.team}` : ''}</h3>
        <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
          Mỗi bé một đường dẫn riêng, chỉ hiện biệt danh và tình trạng của
          nhóm. Trang riêng không có danh sách các bé khác và được chặn khỏi
          công cụ tìm kiếm.
        </p>
        {!hasTeam ? (
          <p className="adm-note">Chọn một nhóm đã lưu ở khung trên để tạo link riêng.</p>
        ) : (
          <>
            <div className="adm-grid" style={{ marginTop: 14 }}>
              <div className="adm-field">
                <label>Biệt danh của bé</label>
                <select value={tokenNickname} onChange={(e) => setTokenNickname(e.target.value)} className="adm-select">
                  <option value="">— Chọn biệt danh —</option>
                  {(selectedTeam?.members ?? []).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="adm-field" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn primary" onClick={createToken}>Tạo link riêng</button>
              </div>
            </div>
            {createdLink && (
              <p className="adm-note" role="status">
                Đường dẫn của bé: <span className="mono">{createdLink}</span>
              </p>
            )}
            {tokens.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {tokens.map((row) => (
                  <div className="adm-prod-row adm-check-row" key={row.token}>
                    <span>
                      {row.nickname}{' '}
                      <span className="mono" style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>
                        /be/{row.token} · {row.created_at}
                        {row.revoked ? ' · Đã thu hồi' : ''}
                      </span>
                    </span>
                    <span></span>
                    {row.revoked ? (
                      <span></span>
                    ) : (
                      <button type="button" className="btn plain" onClick={() => revokeToken(row)}>
                        Thu hồi
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {tokenMsg && <p className="adm-note" role="status">{tokenMsg}</p>}
          </>
        )}
      </div>

      {/* 5) Sổ đồng ý */}
      <div className="adm-card">
        <h3>Sổ đồng ý phụ huynh{selectedTeam ? ` — ${selectedTeam.team}` : ''}</h3>
        <p className="adm-note">
          Nhóm thật (không phải mẫu) chỉ hiển thị công khai những bé có đồng
          ý còn hiệu lực. Bé chưa được ghi nhận đồng ý, hoặc đã rút lại, sẽ
          không hiện trong danh sách thành viên công khai của nhóm.
        </p>
        {!hasTeam ? (
          <p className="adm-note">Chọn một nhóm đã lưu ở khung trên để xem sổ đồng ý của nhóm đó.</p>
        ) : consentNicknames.length === 0 ? (
          <p className="adm-note">Nhóm chưa có biệt danh nào trong danh sách thành viên.</p>
        ) : (
          <>
            {consentNicknames.map((nick) => {
              const row = consentStatusByNick.get(nick)
              const granted = row?.status === 'granted'
              return (
                <div className="adm-prod-row adm-check-row" key={nick}>
                  <span>
                    {nick}{' '}
                    <span className="mono" style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>
                      {row ? `${row.status} · ${row.updated_at}` : 'chưa ghi nhận'}
                    </span>
                  </span>
                  <span></span>
                  {granted ? (
                    <button type="button" className="btn plain" onClick={() => setConsent(nick, 'withdrawn')}>
                      Rút lại
                    </button>
                  ) : (
                    <button type="button" className="btn primary" onClick={() => setConsent(nick, 'granted')}>
                      Ghi nhận đồng ý
                    </button>
                  )}
                </div>
              )
            })}
            {consentMsg && <p className="adm-note" role="status">{consentMsg}</p>}
          </>
        )}
      </div>

      {/* 6) Nhật ký kiểm toán */}
      <div className="adm-card">
        <h3>Nhật ký kiểm toán</h3>
        <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
          50 mục gần nhất ghi lại các thay đổi trên hệ thống.
        </p>
        <div className="adm-actions">
          <button type="button" className="btn plain" onClick={() => void loadAudit()}>
            Tải lại nhật ký
          </button>
        </div>
        {audit.length === 0 ? (
          <p className="adm-note">Chưa có mục nào trong nhật ký.</p>
        ) : (
          <div className="audit-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {audit.slice(0, 50).map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.ts}</td>
                    <td className="mono">{e.action}</td>
                    <td className="mono">
                      {e.target_type}
                      {e.target_id ? ` · ${e.target_id}` : ''}
                    </td>
                    <td>{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7) Đóng băng */}
      <div className="adm-card">
        <h3>Đóng băng cuối khóa</h3>
        <p className="meta" style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>
          Trạng thái hiện tại:{' '}
          {frozen === null
            ? 'chưa rõ'
            : frozen
              ? `Đã đóng băng${frozenAt ? ` từ ${frozenAt}` : ''}.`
              : 'Đang mở, trang nhận gửi nội dung bình thường.'}
        </p>
        {snapshotKey && (
          <p className="adm-note" role="status">
            Bản chụp lưu trữ: <span className="mono">{snapshotKey}</span>
          </p>
        )}
        <div className="adm-actions">
          {frozen ? (
            <button type="button" className="btn plain" onClick={() => setFreeze(false)}>
              Mở băng
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => setFreeze(true)}>
              Đóng băng cuối khóa
            </button>
          )}
        </div>
        {freezeMsg && <p className="adm-note" role="status">{freezeMsg}</p>}
      </div>
    </>
  )
}
