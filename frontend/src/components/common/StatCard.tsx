import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  color?: 'purple' | 'pink' | 'cyan' | 'green' | 'yellow'
}

const accentMap = {
  purple: 'var(--accent-purple)',
  pink: 'var(--accent-pink)',
  cyan: 'var(--accent-cyan)',
  green: 'var(--accent-green)',
  yellow: 'var(--accent-yellow)',
}

export default function StatCard({ label, value, icon, color = 'purple' }: StatCardProps) {
  const accent = accentMap[color]
  return (
    <div className="nb-card" style={{ padding: 'var(--space-4)', ['--card-accent' as any]: accent }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <span style={{ color: accent }}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
    </div>
  )
}