import { GitBranch, ArrowRight, Terminal, Star } from 'lucide-react'
import { useAuthentication } from '../hooks/useAuthentication'
import { Navigate } from 'react-router-dom'
import NavigationBar from '../components/layout/NavigationBar'
import PageContainer from '../components/layout/PageContainer'
import { API_BASE_URL, GITHUB_REPOSITORY_URL } from '../constants/config.constants'

export default function LandingPage() {
  const { user } = useAuthentication()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="landing-root">
      <NavigationBar rightContent={
        <a href={`${API_BASE_URL}/auth/github`} className="btn-nb btn-purple">
          <GitBranch size={13} /> Connect GitHub
        </a>
      } />

      <main className="landing-main">
        <PageContainer width="narrow" padding="hero">
          <div className="landing-hero stagger-in">
            <div className="landing-tags">
              <span className="tag tag-purple">Open Source</span>
              <span className="tag tag-outline">Free Forever</span>
            </div>

            <h1 className="display-title landing-headline">Track Your Developer</h1>
            <h1 className="display-title landing-headline landing-headline-accent">Momentum.</h1>

            <p className="landing-subhead">
              Lower the friction between developer and their personal growth.
            </p>

            <div className="landing-cta">
              <a href={`${API_BASE_URL}/auth/github`} className="btn-nb btn-dark btn-lg">
                <GitBranch size={16} /> Get Started <ArrowRight size={15} />
              </a>
            </div>

            <a
              href="https://pypi.org/project/myclutch/"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-card landing-cli-card"
            >
              <div className="landing-cli-title">Command Line Interface</div>
              <div className="landing-cli-meta">
                <Terminal size={12} /> Access Clutch in your terminal <ArrowRight size={12} />
              </div>
            </a>

            <div className="landing-install">$ pip install myclutch</div>
          </div>
        </PageContainer>
      </main>

      <footer className="landing-footer rise-in-delay">
        <span className="meta-text">© 2026 Clutch — MIT License</span>
        <a href={GITHUB_REPOSITORY_URL} target="_blank" rel="noopener noreferrer" className="inline-link">
          Star on GitHub <Star size={13} />
        </a>
      </footer>
    </div>
  )
}
