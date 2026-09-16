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
export function RailSkeleton() {
  return (
    <div className="nb-card panel">
      <div className="panel-header">
        <Skeleton width="96px" height="var(--text-xl)" />
        <Skeleton width="64px" height="var(--text-lg)" />
      </div>
      <div className="timeline-skeleton-rows">
        {[72, 58, 84, 64].map(width => (
          <div key={width} className="timeline-skeleton-row">
            <Skeleton width="3.5rem" height="var(--text-xs)" />
            <Skeleton width="1.5rem" height="1.5rem" />
            <Skeleton width={`${width}%`} height="var(--text-base)" />
          </div>
        ))}
      </div>
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
