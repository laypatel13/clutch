import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface StateMessageProps {
  title: string
  text: string
  action?: { label: string; onClick: () => void }
  /** Announce immediately — for errors, not for neutral or happy states. */
  alert?: boolean
  /** Shown above the title, e.g. a check mark for an all-clear. */
  icon?: ReactNode
}

/** A whole-panel message for loading failures, empty states and all-clears. */
export default function StateMessage({ title, text, action, alert, icon }: StateMessageProps) {
  return (
    <div className="nb-card panel timeline-state" role={alert ? 'alert' : undefined}>
      {icon && <div className="timeline-state-icon" aria-hidden="true">{icon}</div>}
      <h2 className="timeline-state-title">{title}</h2>
      <p className="timeline-state-text">{text}</p>
      {action && (
        <button type="button" className="btn-nb btn-purple" onClick={action.onClick}>
          <RefreshCw size={14} aria-hidden="true" /> {action.label}
        </button>
      )}
    </div>
  )
}
