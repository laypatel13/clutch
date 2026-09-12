import type { ReactNode } from 'react'

interface PageHeaderProps {
  label: string
  title: ReactNode
  meta?: ReactNode
}

export default function PageHeader({ label, title, meta }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="section-label">{label}</div>
      <h1 className="page-title">{title}</h1>
      {meta && <div className="meta-text">{meta}</div>}
    </div>
  )
}
