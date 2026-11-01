import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import type { Exhibit } from '../../data'
import { StoreDemo } from '../StoreDemo'
import { SkeletonStage } from '../states'
import type { StageHandle } from './stage-scene'

export type StageUiState = 'idle' | 'loading' | 'playing' | 'paused' | 'static' | 'fallback'

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

function isWeakDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2) return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true
  if (nav.connection?.saveData === true) return true
  return false
}

/**
 * Wrapper React cho sân khấu 3D (mục 6.5–6.8).
 * SSR chỉ render khung giữ chỗ + liên kết thật; three chỉ được nạp bằng dynamic import()
 * khi section tới gần viewport (rootMargin 300px). Ma trận fallback ở mục 6.7.
 */
export function ShowcaseStage3D({ exhibits }: { exhibits: Exhibit[] }) {
  const [state, setState] = useState<StageUiState>('idle')
  const stateRef = useRef<StageUiState>('idle')
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<StageHandle | null>(null)
  const startedRef = useRef(false)
  const exhibitsRef = useRef(exhibits)
  exhibitsRef.current = exhibits
  const navigate = useNavigate()

  const applyState = (s: StageUiState) => {
    stateRef.current = s
    setState(s)
  }

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || startedRef.current) return
        startedRef.current = true
        io.disconnect()
        void load()
      },
      { rootMargin: '300px 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    // Ma trận fallback 6.7 theo đúng thứ tự
    if (isWeakDevice() || !webglAvailable()) {
      applyState('fallback')
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    applyState('loading')
    try {
      const { createStage } = await import('./stage-scene')
      const canvas = canvasRef.current
      if (!canvas) {
        applyState('fallback')
        return
      }
      const stage = await createStage(canvas, exhibitsRef.current, {
        static: reduced,
        dust: !reduced,
        onSelect: (teamId) => {
          void navigate({ to: '/du-an/$teamId', params: { teamId } })
        },
        onStateChange: (s) => {
          if (reduced) applyState('static')
          else applyState(s)
        },
        onContextLost: () => applyState('fallback'),
      })
      stageRef.current = stage
      applyState(reduced ? 'static' : stage.getState())
    } catch {
      // Nạp chunk lỗi (mạng) → fallback 2D, không thử lại tự động, không báo lỗi cho phụ huynh.
      applyState('fallback')
    }
  }

  // Dữ liệu live về → dựng lại texture/scene (nhịp seed → live như mọi component khác)
  useEffect(() => {
    if (stageRef.current && (state === 'playing' || state === 'paused' || state === 'static')) {
      stageRef.current.setTeams(exhibits)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhibits])

  useEffect(() => {
    return () => {
      stageRef.current?.dispose()
      stageRef.current = null
    }
  }, [])

  // Khi rơi vào fallback (mất context, lỗi nạp), canvas bị gỡ khỏi DOM — hủy stage để không rò WebGL context.
  useEffect(() => {
    if (state === 'fallback' && stageRef.current) {
      stageRef.current.dispose()
      stageRef.current = null
    }
  }, [state])

  const isFallback = state === 'fallback'

  return (
    <section className="stage3d" id="san-khau-3d" ref={sectionRef} data-stage-state={state}>
      <div className="wrap">
        <h2 className="sec">{isFallback ? 'Hai gian hàng của các con' : 'Hai gian hàng của các con, dựng thành sân khấu 3D'}</h2>
        {!isFallback && (
          <p className="sec-sub">Kéo để xoay sân khấu. Bấm vào một gian hàng để xem hành trình của đội đó.</p>
        )}
        <p className="sr-only">
          {exhibits.map((x) => `${x.team}: ${x.statusText}. Bước tiếp theo: ${x.nextStep}. `).join('')}
        </p>

        {isFallback ? (
          <div className="stage-fallback">
            {exhibits.map((x) => (
              <div className="mini-card" key={x.id}>
                <StoreDemo x={x} mode="mini" />
                <div className="cap">
                  <b>{x.field}</b>
                  <span>
                    {x.team.replace('Nhóm ', '')} · {x.statusText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stage-frame">
            {(state === 'idle' || state === 'loading') && <SkeletonStage />}
            <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" tabIndex={-1}></canvas>
          </div>
        )}

        <div className="stage-links">
          {exhibits.map((x) => (
            <Link key={x.id} className="btn plain" to="/du-an/$teamId" params={{ teamId: x.id }}>
              Xem hành trình {x.team}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
