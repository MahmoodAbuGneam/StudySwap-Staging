import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser } from '../api/users'
import { getUserSkills } from '../api/skills'
import { getUserRatings } from '../api/ratings'
import { addFavorite, removeFavorite } from '../api/favorites'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import SkillBadge from '../components/SkillBadge'
import StarRating from '../components/StarRating'
import SwapRequestModal from '../components/SwapRequestModal'
import { IconStar, IconSwap, IconCoin, IconEdit } from '../components/Icons'

export default function ProfileView() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [ratings, setRatings] = useState([])
  const [isFav, setIsFav] = useState(false)
  const [showSwap, setShowSwap] = useState(false)
  const [activeTab, setActiveTab] = useState('offered')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getUser(id).then(setProfile),
      getUserSkills(id).then(setSkills),
      getUserRatings(id).then((r) => setRatings(r.ratings || [])),
    ]).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (me && profile) setIsFav(me.favorites?.includes(profile.id))
  }, [me, profile])

  const toggleFav = async () => {
    if (isFav) { await removeFavorite(profile.id); setIsFav(false) }
    else        { await addFavorite(profile.id);    setIsFav(true)  }
  }

  if (loading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  )
  if (!profile) return (
    <div className="page-wrapper">
      <div className="empty-state"><p className="text-muted">User not found</p></div>
    </div>
  )

  const isMe = me?.id === profile.id
  const offered = skills.filter((s) => s.type === 'offered')
  const wanted  = skills.filter((s) => s.type === 'wanted')
  const tabSkills = activeTab === 'offered' ? offered : wanted

  return (
    <div className="page-wrapper">
      {/* ── Profile header card ───────────────────────── */}
      <div className="card card-p anim-fade-up" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Avatar src={profile.avatar_url} name={profile.display_name} size="2xl" />

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
                  {profile.display_name}
                </h1>
                {profile.academic_field && (
                  <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 10 }}>{profile.academic_field}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRating value={profile.avg_rating} readonly size="sm" />
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                      {profile.total_ratings > 0 ? `${profile.avg_rating.toFixed(1)} (${profile.total_ratings})` : 'No ratings yet'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-3)' }}>
                    <span style={{ width: 14, height: 14, color: 'var(--gold)' }}><IconCoin /></span>
                    {profile.credits} credit{profile.credits !== 1 ? 's' : ''}
                  </div>
                </div>
                {profile.session_types?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {profile.session_types.map((t) => (
                      <span key={t} className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isMe && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={toggleFav}
                    className={`btn btn-sm ${isFav ? 'btn-gold' : 'btn-ghost'}`}
                    style={{ gap: 5 }}
                  >
                    <span style={{ width: 15, height: 15 }}><IconStar /></span>
                    {isFav ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={() => setShowSwap(true)} className="btn btn-primary btn-sm" style={{ gap: 5 }}>
                    <span style={{ width: 15, height: 15 }}><IconSwap /></span>
                    Request Swap
                  </button>
                </div>
              )}
              {isMe && (
                <button onClick={() => navigate('/profile/me')} className="btn btn-ghost btn-sm" style={{ gap: 5 }}>
                  <span style={{ width: 15, height: 15 }}><IconEdit /></span>
                  Edit profile
                </button>
              )}
            </div>

            {profile.bio && (
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 600, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* ── Skills ───────────────────────────────────── */}
        <div className="card card-p anim-fade-up delay-1">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Skills</h2>
            {!isMe && (
              <button onClick={() => setShowSwap(true)} className="btn btn-gold btn-sm">
                Request Swap
              </button>
            )}
          </div>

          <div className="tabs" style={{ marginBottom: 20 }}>
            <button className={`tab-btn ${activeTab === 'offered' ? 'active' : ''}`} onClick={() => setActiveTab('offered')}>
              Offering ({offered.length})
            </button>
            <button className={`tab-btn ${activeTab === 'wanted' ? 'active' : ''}`} onClick={() => setActiveTab('wanted')}>
              Wanting ({wanted.length})
            </button>
          </div>

          {tabSkills.length === 0 ? (
            <div className="empty-state"><p className="text-muted">No {activeTab} skills listed</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {tabSkills.map((s) => (
                <div key={s.id} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--text-1)' }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <SkillBadge name={s.category} />
                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{s.level}</span>
                  </div>
                  {s.description && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>{s.description}</p>}
                  {s.deadline && <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4 }}>⏰ Due {s.deadline}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Ratings ──────────────────────────────────── */}
        <div className="card card-p anim-fade-up delay-2">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
            Reviews
          </h2>
          {profile.total_ratings > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px', background: 'var(--bg)', borderRadius: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
                  {profile.avg_rating.toFixed(1)}
                </div>
                <StarRating value={profile.avg_rating} readonly size="sm" />
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{profile.total_ratings} review{profile.total_ratings !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
            {ratings.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <p className="text-muted">No reviews yet</p>
              </div>
            ) : ratings.map((r) => (
              <div key={r.id} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <StarRating value={r.score} readonly size="sm" />
                  {r.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.tags.map((tag) => (
                        <span key={tag} className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {r.review && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{r.review}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSwap && (
        <SwapRequestModal
          recipient={profile}
          matchData={{ they_can_teach_me: offered.map(s => ({ id: s.id, name: s.name, level: s.level })) }}
          onClose={() => setShowSwap(false)}
        />
      )}
    </div>
  )
}
