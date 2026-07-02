import { useState, useEffect, type ReactNode } from 'react'
interface NavigationBarProps { rightContent?: ReactNode }

export default function NavigationBar({ rightContent }: NavigationBarProps) {
  const[isDark,setIsDark] =useState(()=>{
    if( typeof window !=='undefined'){
      return localStorage.getItem('theme')==='dark'
    }
    return false
  })

  useEffect(()=>{
    const root=document.documentElement
    if(isDark) {
      root.setAttribute('data-theme','dark')
      localStorage.setItem('theme','dark')
    }
    else{
      root.setAttribute('data-theme','light')
      localStorage.setItem('theme','light')
    }
  },[isDark]);
  return (
    <nav className="nb-nav">
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-xl)', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Clutch</span>
        <span className="tag tag-green">ONLINE</span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>{rightContent}
        <button
          onClick={()=> setIsDark(!isDark)}
          style={{cursor:'pointer',background:'none',border:'1px solid var(--text-primary)',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'4px'}}
          aria-label="Toggle theme"
          >
            {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          )}
        </button>
        
      </div>
    </nav>
  )
}
