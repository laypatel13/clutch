import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  /** Width preset. `wide` for app pages, `narrow` for Landing and Profile. */
  width?: 'wide' | 'narrow'
  padding?: 'default' | 'roomy' | 'hero'
  /** Applies the quieter typographic treatment used outside the Landing page. */
  tone?: 'dashboard' | 'profile'
}

const TONE_CLASS = {
  dashboard: 'dashboard-content',
  profile: 'profile-content',
} as const

export default function PageContainer({
  children,
  width = 'wide',
  padding = 'default',
  tone,
}: PageContainerProps) {
  const className = tone ? `page-container ${TONE_CLASS[tone]}` : 'page-container'

  return (
    <div
      className={className}
      data-width={width}
      data-pad={padding === 'default' ? undefined : padding}
    >
      {children}
    </div>
  )
}
