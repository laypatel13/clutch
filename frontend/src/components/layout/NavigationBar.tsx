import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { GITHUB_REPOSITORY_URL } from '../../constants/config.constants'
import { useAuthentication } from '../../hooks/useAuthentication'
import GitHubIcon from '../common/GitHubIcon'

interface NavigationBarProps { rightContent?: ReactNode }

export default function NavigationBar({ rightContent }: NavigationBarProps) {
  const { user } = useAuthentication()
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [isDark])

  return (
    <nav className="nb-nav blur-fade-in">
      <Link to="/" className="nb-nav-brand">
        <span className="wordmark">Clutch</span>
        <span className="badge badge-green">{user ? 'CONNECTED' : 'CONNECT'}</span>
      </Link>
      <div className="nb-nav-right">
        {rightContent}

        <a
          href={GITHUB_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
          className="icon-btn-circle"
        >
          <GitHubIcon />
        </a>

        <button
          onClick={() => setIsDark(!isDark)}
          className="icon-btn-circle"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  )
}
