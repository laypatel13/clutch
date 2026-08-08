interface LoadingScreenProps { message?: string }

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 'var(--space-5)', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--font-chrome)', fontWeight: 800, fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        Clutch<span className="blink" style={{ color: 'var(--accent-purple)' }}>_</span>
      </div>
      <div style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{message}</div>
    </div>
  )
}
