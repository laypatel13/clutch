import type { ReactNode } from 'react'
import NavigationBar from './NavigationBar'
import AppSidebar from './AppSidebar'

interface AppLayoutProps {
  children: ReactNode
  rightContent?: ReactNode
}

export default function AppLayout({ children, rightContent }: AppLayoutProps) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <NavigationBar rightContent={rightContent} />
      <div className="app-shell">
        <AppSidebar />
        <main className="app-shell-content">
          {children}
        </main>
      </div>
    </div>
  )
}
