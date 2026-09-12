import { useState, useEffect, useRef, type ReactNode } from 'react'
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

  // The sticky sidebar positions itself directly beneath this nav, so it needs
  // the nav's real height. Publish it as --nav-h instead of hardcoding: the
  // height changes with viewport width and with whatever rightContent a page
  // passes in, and a stale value shows up as a misaligned sidebar.
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const publishHeight = () => {
      document.documentElement.style.setProperty('--nav-h', `${nav.offsetHeight}px`)
    }
    publishHeight()
    const observer = new ResizeObserver(publishHeight)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [])

  return (
    <nav ref={navRef} className="nb-nav rise-in">
      <Link to="/" viewTransition className="nb-nav-brand">
        <span className="wordmark">Clutch</span>
        <span className="badge badge-green nb-nav-status">{user ? 'CONNECTED' : 'CONNECT'}</span>
      </Link>
      <div className="nb-nav-right">
        {rightContent}

        <a
          href={GITHUB_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
          className="icon-btn-circle nb-nav-github"
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
