import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import httpClient from '../api/httpClient'
import { MapPin, Users, BookOpen, ArrowLeft } from 'lucide-react'
import NavigationBar from '../components/layout/NavigationBar'
import PageContainer from '../components/layout/PageContainer'
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
    <div className="centered-viewport">
      <h1 className="entity-title">User not found</h1>
      <p className="meta-text">@{username} doesn't exist or has a private profile.</p>
    </div>
  )

  if (!profile) return <LoadingScreen message="Loading profile..." />

  return (
    <div className="app-root">
      <NavigationBar rightContent={
        <Link to="/dashboard" className="btn-nb btn-grey btn-sm"><ArrowLeft size={14} /> Dashboard</Link>
      } />
      <PageContainer width="narrow" padding="roomy" tone="profile">
        <div className="section-label">Profile</div>
        <div className="nb-card nb-accent-purple profile-card">
          <div className="profile-header-row">
            <img src={profile.avatar_url || ''} alt={profile.username} className="profile-avatar" />
            <div className="flex-fill">
              <h1 className="entity-title profile-name">{profile.name || profile.username}</h1>
              <p className="profile-handle">@{profile.username}</p>
              {profile.bio && <p className="body-text profile-bio">{profile.bio}</p>}
              <div className="profile-meta-row">
                {profile.location && (
                  <span className="profile-meta-item">
                    <MapPin size={12} color="var(--accent-yellow-on-surface)" />{profile.location}
                  </span>
                )}
                <span className="profile-meta-item">
                  <Users size={12} color="var(--accent-pink-on-surface)" />{profile.followers} followers
                </span>
                <span className="profile-meta-item">
                  <BookOpen size={12} color="var(--accent-purple-on-surface)" />{profile.public_repos} repositories
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
