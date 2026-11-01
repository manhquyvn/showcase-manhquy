import type { ReactNode } from 'react'

/** Khối skeleton đúng hình component đích (mục 4.14) — vệt sáng tắt khi reduced-motion qua CSS. */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true"></div>
}

export function SkeletonStatus() {
  return (
    <div className="status skeleton-status" aria-label="Đang tải tình trạng dự án">
      <Skeleton style={{ height: 18, width: '55%' }} />
      <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} style={{ height: 8, flex: 1, borderRadius: 99 }} />
        ))}
      </div>
      <Skeleton style={{ height: 14, width: '80%', marginTop: 14 }} />
      <Skeleton style={{ height: 14, width: '65%', marginTop: 8 }} />
    </div>
  )
}

export function SkeletonTeam() {
  return (
    <div aria-label="Đang tải thông tin nhóm">
      <Skeleton style={{ height: 260, borderRadius: 16 }} />
      <Skeleton style={{ height: 16, width: '35%', marginTop: 20 }} />
      <Skeleton style={{ height: 28, width: '70%', marginTop: 10 }} />
      <Skeleton style={{ height: 15, width: '92%', marginTop: 12 }} />
      <Skeleton style={{ height: 15, width: '84%', marginTop: 8 }} />
    </div>
  )
}

export function SkeletonTimeline({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ maxWidth: 720, marginTop: 26 }} aria-label="Đang tải cập nhật">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 20 }}>
          <Skeleton style={{ width: 18, height: 18, borderRadius: '50%', flex: 'none' }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ height: 15, width: '45%' }} />
            <Skeleton style={{ height: 14, width: '88%', marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonStage() {
  return (
    <div className="stage-skeleton" aria-label="Đang tải sân khấu 3D">
      <Skeleton style={{ height: '100%', width: '100%', borderRadius: 16 }} />
    </div>
  )
}

/** Khung trạng thái rỗng/lỗi (mục 4.14): một câu trạng thái + đúng một bước tiếp theo. */
export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty" role="status">
      <p>{children}</p>
      {action}
    </div>
  )
}
