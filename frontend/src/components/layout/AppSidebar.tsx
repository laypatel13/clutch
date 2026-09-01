import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react'
import { useAuthentication } from '../../hooks/useAuthentication'
import { getNavItems, SIDEBAR_STORAGE_KEY } from '../../constants/navigation.constants'

export default function AppSidebar() {
  const { user, logout } = useAuthentication()
  const location = useLocation()
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    }
    return false
  })

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
  }

  const navItems = getNavItems(user?.username)

  return (
    <aside className="app-sidebar" data-expanded={expanded}>
      <nav className="app-sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
            || (item.path.startsWith('/u/') && location.pathname.startsWith('/u/'))
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className="app-sidebar-item"
              data-active={isActive}
              aria-label={item.label}
              title={expanded ? undefined : item.label}
            >
              <Icon size={18} strokeWidth={2} className="app-sidebar-icon" />
              <span className="app-sidebar-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="app-sidebar-bottom">
        <button
          onClick={logout}
          className="app-sidebar-item app-sidebar-logout"
          aria-label="Log out"
          title={expanded ? undefined : 'Log out'}
        >
          <LogOut size={18} strokeWidth={2} className="app-sidebar-icon" />
          <span className="app-sidebar-label">Log out</span>
        </button>

        <button
          onClick={toggleExpanded}
          className="app-sidebar-toggle"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        </button>
      </div>
    </aside>
  )
}
