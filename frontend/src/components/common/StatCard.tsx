import type { ReactNode } from 'react'

export type AccentName = 'purple' | 'pink' | 'cyan' | 'green' | 'yellow' | 'orange'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  color?: AccentName
}

export default function StatCard({ label, value, icon, color = 'purple' }: StatCardProps) {
  // The bright accent draws the border and shadow; -on-surface is the readable
  // variant for the icon and value, which sit as text on the card.
  const ink = `var(--accent-${color}-on-surface)`

  return (
    <div className={`nb-card nb-accent-${color} stat-card`}>
      <div className="stat-card-head">
        <span className="stat-card-icon" style={{ color: ink }}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={{ color: ink }}>{value}</div>
    </div>
  )
}
