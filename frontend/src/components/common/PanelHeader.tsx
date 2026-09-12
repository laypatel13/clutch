import type { ReactNode } from 'react'

interface PanelHeaderProps {
  label: ReactNode
  /** Icon rendered beside the label, outside it, e.g. a warning triangle. */
  leading?: ReactNode
  /** Right-aligned slot, usually a `.tag` carrying a count or time range. */
  trailing?: ReactNode
}

export default function PanelHeader({ label, leading, trailing }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="panel-header-main">
        {leading}
        <span className="section-label">{label}</span>
      </div>
      {trailing}
    </div>
  )
}
