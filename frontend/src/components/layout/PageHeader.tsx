import type { ReactNode } from 'react'

interface PageHeaderProps {
  label: string
  title: ReactNode
  meta?: ReactNode
  /** Extra content inside the header block, below the meta line. */
  children?: ReactNode
}

export default function PageHeader({ label, title, meta, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="section-label">{label}</div>
      <h1 className="page-title">{title}</h1>
      {meta && <div className="meta-text">{meta}</div>}
      {children}
    </div>
  )
}
