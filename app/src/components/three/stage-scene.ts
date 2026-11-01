import * as THREE from 'three'
import type { Exhibit } from '../../data'
import { createPassTexture, createShadowTexture, createShopTexture } from './stage-textures'

/**
 * Sân khấu 3D — hai gian hàng nổi (DESIGN-SYSTEM mục 6.4).
 * Module thuần TypeScript, không import React, không chạm document ngoài canvas được truyền vào.
 * Chỉ import lõi 'three' — cấm three/examples/* và three/addons/*.
 */
export type StageState = 'playing' | 'paused' | 'static'

export interface StageOpts {
  static?: boolean
  dust?: boolean
  onSelect?: (teamId: string) => void
  onStateChange?: (s: StageState) => void
  onContextLost?: () => void
}

export interface StageHandle {
  setTeams: (teams: Exhibit[]) => void
  dispose: () => void
  getState: () => StageState
}

export async function createStage(
  canvas: HTMLCanvasElement,
  teamsIn: Exhibit[],
  opts: StageOpts = {},
): Promise<StageHandle> {
  // Chờ font trước lần vẽ texture đầu tiên; lỗi font thì vẽ bằng font hệ thống và không vẽ lại (mục 6.4).
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((res) => setTimeout(res, 1500)),
    ])
  } catch {
    /* bỏ qua — dùng font hệ thống */
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    stencil: false,
    powerPreference: 'high-performance',
  })
  renderer.shadowMap.enabled = false

  const scene = new THREE.Scene()
  scene.background = null
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 1.55, 7.4)
  camera.lookAt(0, 0.55, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.85))
  const dir = new THREE.DirectionalLight(0xffffff, 1.1)
  dir.position.set(2.5, 4, 3)
  scene.add(dir)

  const stageGroup = new THREE.Group()
  scene.add(stageGroup)

  const maxAniso = renderer.capabilities.getMaxAnisotropy()
  const passTex = createPassTexture()
  const shadowTex = createShadowTexture()

  let teams: Exhibit[] = []
  let teamGroups: THREE.Group[] = []
  let pickables: THREE.Object3D[] = []

  const disposables: { dispose: () => void }[] = []

  function buildTeams(list: Exhibit[]) {
    // Dọn nhóm cũ
    for (const g of teamGroups) {
      stageGroup.remove(g)
      g.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
        const kill = (m: THREE.Material) => {
          const map = (m as THREE.MeshBasicMaterial).map
          if (map && map !== passTex && map !== shadowTex) map.dispose()
          m.dispose()
        }
        if (Array.isArray(mat)) mat.forEach(kill)
        else if (mat) kill(mat)
      })
    }
    teamGroups = []
    pickables = []
    teams = list.slice(0, 2)

    teams.forEach((team, i) => {
      const g = new THREE.Group()
      g.position.x = teams.length === 1 ? 0 : i === 0 ? -1.62 : 1.62
      g.userData.phase = i * Math.PI

      const card = new THREE.Group()
      card.name = 'card'
      const plateGeo = new THREE.BoxGeometry(2.66, 1.76, 0.06)
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.6, metalness: 0.1 })
      const plate = new THREE.Mesh(plateGeo, plateMat)
      plate.userData.teamId = team.id
      card.add(plate)

      const faceTex = createShopTexture(team, maxAniso)
      disposables.push(faceTex)
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 1.7),
        new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }),
      )
      face.position.z = 0.035
      face.userData.teamId = team.id
      card.add(face)

      if (team.progressDone >= 4) {
        const stamp = new THREE.Mesh(
          new THREE.PlaneGeometry(0.62, 0.24),
          new THREE.MeshBasicMaterial({ map: passTex, transparent: true, toneMapped: false }),
        )
        stamp.position.set(0.95, 0.72, 0.09)
        stamp.rotation.z = (-5 * Math.PI) / 180
        card.add(stamp)
      }
      g.add(card)

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.02, 1.22, 0.12, 40),
        new THREE.MeshStandardMaterial({ color: 0x16233c, roughness: 0.6, metalness: 0.1 }),
      )
      pedestal.position.y = -1.12
      g.add(pedestal)

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.14, 0.016, 8, 64),
        new THREE.MeshBasicMaterial({ color: 0x1aa3c4 }),
      )
      ring.rotation.x = Math.PI / 2
      ring.position.y = -1.05
      g.add(ring)

      for (let s = 0; s < 6; s++) {
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.05, 0.05),
          new THREE.MeshBasicMaterial({ color: s < team.progressDone ? 0x1aa3c4 : 0x22314c }),
        )
        seg.position.set((s - 2.5) * 0.38, -0.99, 0.55)
        g.add(seg)
      }

      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 0.7),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false }),
      )
      shadow.rotation.x = -Math.PI / 2
      shadow.position.y = -1.2
      g.add(shadow)

      stageGroup.add(g)
      teamGroups.push(g)
      pickables.push(face, plate)
    })
  }

  buildTeams(teamsIn)

  // Bụi teal nhẹ — tối đa 60 điểm
  let dust: THREE.Points | null = null
  if (opts.dust !== false && !opts.static) {
    const n = 60
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -3.4 + Math.random() * 6.8
      pos[i * 3 + 1] = -1.2 + Math.random() * 3.2
      pos[i * 3 + 2] = -1 + Math.random() * 1
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    dust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0x5bc8de, size: 0.02, transparent: true, opacity: 0.7 }),
    )
    scene.add(dust)
  }

  // --- Trạng thái chạy / tương tác ---
  const isStatic = !!opts.static
  let state: StageState = isStatic ? 'static' : 'paused'
  let raf = 0
  let visible = false
  let pageVisible = document.visibilityState === 'visible'
  let disposed = false
  let interacted = false
  let curRotY = isStatic ? -0.18 : -0.3
  let curRotX = 0
  let targetRotY = isStatic ? -0.18 : 0
  let targetRotX = 0
  let lastT = performance.now()

  function emit() {
    opts.onStateChange?.(state)
  }
  function setState(s: StageState) {
    if (state !== s) {
      state = s
      emit()
    }
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 800
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 350
    const cap = w < 760 ? 1.5 : 1.75
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  let resizeTimer = 0
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      if (disposed) return
      resize()
      if (isStatic) renderOnce()
    }, 100)
  })
  if (canvas.parentElement) ro.observe(canvas.parentElement)
  resize()

  function frame(now: number) {
    if (disposed) return
    const dt = Math.min(0.05, (now - lastT) / 1000)
    lastT = now
    const t = now / 1000
    const k = 1 - Math.exp(-dt * 8)
    curRotY += (targetRotY - curRotY) * k
    curRotX += (targetRotX - curRotX) * k
    const sway = interacted ? 0 : Math.sin(t * 0.11) * 0.07
    stageGroup.rotation.y = curRotY + sway
    stageGroup.rotation.x = curRotX
    teamGroups.forEach((g) => {
      g.position.y = Math.sin(t * 0.9 + (g.userData.phase as number)) * 0.055
    })
    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }

  function start() {
    if (disposed || isStatic || raf) return
    lastT = performance.now()
    raf = requestAnimationFrame(frame)
    setState('playing')
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    if (!isStatic) setState('paused')
  }
  function syncRun() {
    if (visible && pageVisible) start()
    else stop()
  }

  function renderOnce() {
    stageGroup.rotation.y = -0.18
    renderer.render(scene, camera)
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting)
      syncRun()
    },
    { threshold: 0.05 },
  )
  io.observe(canvas)

  const onVis = () => {
    pageVisible = document.visibilityState === 'visible'
    syncRun()
  }
  document.addEventListener('visibilitychange', onVis)

  // --- Kéo + bấm chọn đội ---
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let dragging = false
  let dragMoved = 0
  let lastX = 0
  let lastY = 0
  let downX = 0
  let downY = 0
  let hoverCheck = 0
  const hoverable = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

  function setPointer(e: PointerEvent) {
    const r = canvas.getBoundingClientRect()
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }
  function pick(e: PointerEvent): string | null {
    setPointer(e)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(pickables, false)
    return hits.length ? (hits[0].object.userData.teamId as string) : null
  }

  const onDown = (e: PointerEvent) => {
    if (isStatic) return
    dragging = true
    dragMoved = 0
    lastX = downX = e.clientX
    lastY = downY = e.clientY
  }
  const onMove = (e: PointerEvent) => {
    if (dragging && !isStatic) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      dragMoved += Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY)
      lastX = e.clientX
      lastY = e.clientY
      interacted = true
      targetRotY = THREE.MathUtils.clamp(targetRotY + dx * 0.005, -0.38, 0.38)
      targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.003, -0.1, 0.14)
      return
    }
    if (hoverable && !isStatic) {
      const now = performance.now()
      if (now - hoverCheck < 50) return
      hoverCheck = now
      const id = pick(e)
      canvas.style.cursor = id ? 'pointer' : 'grab'
      teamGroups.forEach((g) => {
        const card = g.getObjectByName('card')
        const isHit = id && teams[teamGroups.indexOf(g)]?.id === id
        if (card) {
          const s = isHit ? 1.03 : 1
          card.scale.set(s, s, s)
        }
      })
    }
  }
  const onUp = (e: PointerEvent) => {
    if (!dragging) return
    dragging = false
    const total = Math.hypot(e.clientX - downX, e.clientY - downY)
    if (total < 6 && !isStatic) {
      const id = pick(e)
      if (id) opts.onSelect?.(id)
    }
    void dragMoved
  }

  if (!isStatic) {
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onUp)
  }

  const onContextLost = (e: Event) => {
    e.preventDefault()
    stop()
    opts.onContextLost?.()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  if (isStatic) {
    renderOnce()
    emit()
  } else {
    // Sơn một khung đầu ngay cả khi chưa vào viewport để canvas không trống
    renderer.render(scene, camera)
    syncRun()
  }

  return {
    setTeams(list: Exhibit[]) {
      if (disposed) return
      buildTeams(list)
      if (isStatic) renderOnce()
      else renderer.render(scene, camera)
    },
    getState: () => state,
    dispose() {
      disposed = true
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onUp)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
      for (const d of disposables) d.dispose()
      passTex.dispose()
      shadowTex.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
