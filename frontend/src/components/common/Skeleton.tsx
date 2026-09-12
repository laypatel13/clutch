interface SkeletonProps {
  /** Width as any CSS length; defaults to filling the parent. */
  width?: string
  height?: string
}

export function Skeleton({ width, height }: SkeletonProps) {
  return <span className="skeleton" style={{ width, height }} aria-hidden="true" />
}

/**
 * Placeholders shaped like the real content they stand in for, so nothing
 * shifts when data arrives. They render inside the normal page shell — the
 * nav, sidebar and page header stay put rather than being replaced wholesale.
 */
export function StatCardSkeleton() {
  return (
    <div className="nb-card stat-card">
      <div className="stat-card-head">
        <Skeleton width="60%" height="var(--text-xs)" />
      </div>
      <Skeleton width="40%" height="var(--text-3xl)" />
    </div>
  )
}

export function PanelSkeleton({ bodyHeight = '130px' }: { bodyHeight?: string }) {
  return (
    <div className="nb-card panel">
      <div className="panel-header">
        <Skeleton width="140px" height="var(--text-xs)" />
        <Skeleton width="72px" height="var(--text-lg)" />
      </div>
      <Skeleton height={bodyHeight} />
    </div>
  )
}

/** Wraps a loading region so assistive tech announces it as busy. */
export function SkeletonRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-label={label}>
      {children}
    </div>
  )
}
