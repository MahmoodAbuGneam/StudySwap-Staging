import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listFavorites, removeFavorite } from '../api/favorites'
import Avatar from '../components/Avatar'
import StarRating from '../components/StarRating'
import SwapRequestModal from '../components/SwapRequestModal'
import { IconStar, IconSwap, IconCoin } from '../components/Icons'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [swapTarget, setSwapTarget] = useState(null)

  useEffect(() => {
    listFavorites()
      .then((d) => setFavorites(d.favorites || []))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (id) => {
    await removeFavorite(id)
    setFavorites((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <div className="page-wrapper">
      {/* ── Header ───────────────────────────────────── */}
      <div className="page-header">
        <h1 className="text-page-title">Saved Profiles</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>
          {loading ? 'Loading…' : `${favorites.length} saved profile${favorites.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="card anim-fade-up">
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No saved profiles yet</h3>
            <p className="text-muted" style={{ maxWidth: 340, textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              Save profiles from Browse or any user's profile page to find them quickly.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/browse" className="btn btn-primary btn-sm">Browse users</Link>
              <Link to="/matches" className="btn btn-ghost btn-sm">View matches</Link>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {favorites.map((u, i) => (
            <div
              key={u.id}
              className="card card-p anim-fade-up"
              style={{ animationDelay: `${i * 0.06}s`, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Top: avatar + name + unsave */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Link to={`/profile/${u.id}`}>
                  <Avatar src={u.avatar_url} name={u.display_name} size="md" />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    to={`/profile/${u.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.display_name}
                    </div>
                  </Link>
                  {u.academic_field && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.academic_field}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StarRating value={u.avg_rating} readonly size="sm" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)' }}>
                      <span style={{ width: 12, height: 12, color: 'var(--gold)' }}><IconCoin /></span>
                      {u.credits}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(u.id)}
                  className="btn btn-ghost btn-icon btn-sm"
                  title="Remove from favorites"
                  style={{ color: 'var(--gold)', flexShrink: 0 }}
                >
                  <span style={{ width: 16, height: 16 }}><IconStar /></span>
                </button>
              </div>

              {/* Bio */}
              {u.bio && (
                <p className="truncate-2" style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  {u.bio}
                </p>
              )}

              {/* Session types */}
              {u.session_types?.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {u.session_types.map((t) => (
                    <span key={t} className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{t}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <Link to={`/profile/${u.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  View Profile
                </Link>
                <button
                  onClick={() => setSwapTarget(u)}
                  className="btn btn-gold btn-sm"
                  style={{ flex: 1, gap: 5 }}
                >
                  <span style={{ width: 13, height: 13 }}><IconSwap /></span>
                  Swap
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {swapTarget && (
        <SwapRequestModal
          recipient={swapTarget}
          matchData={{ they_can_teach_me: [] }}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  )
}
