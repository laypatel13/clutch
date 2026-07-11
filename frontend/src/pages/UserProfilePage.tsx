import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import httpClient from '../api/httpClient'
import { MapPin, Users, BookOpen } from 'lucide-react'
import NavigationBar from '../components/layout/NavigationBar'
import LoadingScreen from '../components/common/LoadingScreen'
import type { PublicUserProfile } from '../types/user.types'

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    httpClient.get(`/users/${username}`).then(r => setProfile(r.data)).catch(() => setNotFound(true))
  }, [username])

  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 'var(--space-3)', background: 'var(--bg)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>User not found</h1>
      <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>@{username} doesn't exist or has a private profile.</p>
    </div>
  )

  if (!profile) return <LoadingScreen message="Loading profile..." />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavigationBar rightContent={
        <a href="/dashboard" className="btn-nb btn-ghost" style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-4)' }}>← Dashboard</a>
      } />
      <div className="page-container" style={{ maxWidth: '620px', margin: '0 auto', padding: 'var(--space-14) var(--space-8)' }}>
        <div className="section-label">Profile</div>
        <div className="nb-panel-purple" style={{ padding: 'var(--space-7)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
            <img src={profile.avatar_url || ''} alt={profile.username} style={{ width: '72px', height: '72px', border: '2px solid var(--border)',boxShadow:'2px 2px 0 var(--border)',borderRadius:'50%',objectFit:'cover', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                {profile.name || profile.username}
              </h1>
              <p style={{ fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--accent-purple)', marginBottom: 'var(--space-3)' }}>@{profile.username}</p>
              {profile.bio && (
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>{profile.bio}</p>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                {profile.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    <MapPin size={12} color="var(--accent-yellow)" />{profile.location}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  <Users size={12} color="var(--accent-pink)" />{profile.followers} followers
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontFamily: 'var(--font-chrome)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  <BookOpen size={12} color="var(--accent-purple)" />{profile.public_repos} repos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
