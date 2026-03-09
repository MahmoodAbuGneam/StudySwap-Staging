import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMatches } from '../api/matches'
import Avatar from '../components/Avatar'
import ScoreRing from '../components/ScoreRing'
import SkillBadge from '../components/SkillBadge'
import StarRating from '../components/StarRating'
import SwapRequestModal from '../components/SwapRequestModal'
import { IconCoin, IconSwap, IconArrowRight } from '../components/Icons'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sort, setSort] = useState('score')

  useEffect(() => {
    getMatches()
      .then((d) => setMatches(d.matches || []))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...matches].sort((a, b) => {
    if (sort === 'score')  return b.swap_score - a.swap_score
    if (sort === 'rating') return b.user.avg_rating - a.user.avg_rating
    if (sort === 'name')   return a.user.display_name.localeCompare(b.user.display_name)
    return 0
  })

  return (
    <div className="page-wrapper">
      {/* ── Header ───────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-page-title">Mutual Matches</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            {loading ? 'Finding matches…' : `${matches.length} match${matches.length !== 1 ? 'es' : ''} — people you can swap with`}
          </p>
        </div>
        {matches.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Sort:</span>
            {['score', 'rating', 'name'].map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`btn btn-sm ${sort === s ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card anim-fade-up">
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
            <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No mutual matches yet</h3>
            <p className="text-muted" style={{ maxWidth: 400, textAlign: 'center', lineHeight: 1.7, marginBottom: 20 }}>
              Add skills you offer and skills you want to learn. The algorithm will find people who match both sides.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/profile/me" className="btn btn-primary btn-sm">Add my skills</Link>
              <Link to="/browse" className="btn btn-ghost btn-sm">Browse users</Link>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sorted.map((match, i) => (
            <div
              key={match.user.id}
              className="card card-p anim-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Left: avatar + info */}
                <Link to={`/profile/${match.user.id}`} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, textDecoration: 'none', minWidth: 0 }}>
                  <Avatar src={match.user.avatar_url} name={match.user.display_name} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-1)', marginBottom: 3 }}>
                      {match.user.display_name}
                    </div>
                    {match.user.academic_field && (
                      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>
                        {match.user.academic_field}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <StarRating value={match.user.avg_rating} readonly size="sm" />
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {match.user.avg_rating > 0 ? match.user.avg_rating.toFixed(1) : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)' }}>
                        <span style={{ width: 13, height: 13, color: 'var(--gold)' }}><IconCoin /></span>
                        {match.user.credits} credits
                      </div>
                      {match.user.session_types?.map((t) => (
                        <span key={t} className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{t}</span>
                      ))}
                    </div>

                    {/* Skill overlap rows */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                      <div>
                        <div className="section-label" style={{ marginBottom: 8, color: 'var(--teal)' }}>They teach you</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {match.they_can_teach_me.length === 0
                            ? <span className="text-meta">—</span>
                            : match.they_can_teach_me.slice(0, 4).map((s) => (
                                <SkillBadge key={s.id} name={s.name} level={s.level} type="offered" />
                              ))
                          }
                        </div>
                      </div>
                      <div>
                        <div className="section-label" style={{ marginBottom: 8, color: 'var(--gold)' }}>You teach them</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {match.i_can_teach_them.length === 0
                            ? <span className="text-meta">—</span>
                            : match.i_can_teach_them.slice(0, 4).map((s) => (
                                <SkillBadge key={s.id} name={s.name} level={s.level} type="wanted" />
                              ))
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Right: score ring + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flexShrink: 0, paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="section-label" style={{ marginBottom: 8 }}>Swap score</div>
                    <ScoreRing score={match.swap_score} size={72} />
                  </div>
                  <button
                    onClick={() => setSelected(match)}
                    className="btn btn-gold btn-sm"
                    style={{ gap: 5, width: '100%' }}
                  >
                    <span style={{ width: 14, height: 14 }}><IconSwap /></span>
                    Request
                  </button>
                  <Link
                    to={`/profile/${match.user.id}`}
                    className="btn btn-ghost btn-sm"
                    style={{ gap: 5, width: '100%' }}
                  >
                    Profile
                    <span style={{ width: 14, height: 14 }}><IconArrowRight /></span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <SwapRequestModal
          recipient={selected.user}
          matchData={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
