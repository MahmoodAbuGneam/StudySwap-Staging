import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMatches } from '../api/matches'
import { listSwaps } from '../api/swaps'
import { getMySkills } from '../api/skills'
import Avatar from '../components/Avatar'
import ScoreRing from '../components/ScoreRing'
import SkillBadge from '../components/SkillBadge'
import StarRating from '../components/StarRating'
import {
  IconCoin, IconSwap, IconStar, IconMatch,
  IconArrowRight, IconBrowse, IconUser, IconZap,
} from '../components/Icons'
import TrustBadge from '../components/TrustBadge'

const STATUS_COLORS = {
  pending:   { bg: 'var(--amber-pale)', color: 'var(--amber)' },
  accepted:  { bg: 'var(--teal-pale)',  color: 'var(--teal)'  },
  completed: { bg: 'var(--green-pale)', color: 'var(--green)' },
  rejected:  { bg: 'var(--coral-pale)', color: 'var(--coral)' },
  cancelled: { bg: 'rgba(11,25,41,0.05)', color: 'var(--text-3)' },
}

function greeting(name) {
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${greet}, ${name?.split(' ')[0] || 'there'}!`
}

function dateStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [swaps, setSwaps] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMatches().then((d) => setMatches(d.matches || [])),
      listSwaps().then(setSwaps),
      getMySkills().then(setSkills),
    ]).finally(() => setLoading(false))
  }, [])

  const activeSwaps = swaps.filter((s) => ['pending', 'accepted'].includes(s.status)).slice(0, 3)
  const completedCount = swaps.filter((s) => s.status === 'completed').length
  const topMatches = matches.slice(0, 3)
  const offeredSkills = skills.filter((s) => s.type === 'offered')
  const wantedSkills = skills.filter((s) => s.type === 'wanted')

  const STATS = [
    { label: 'Contribution Score', value: user?.credits ?? 0,         icon: IconCoin,  color: 'var(--gold)',   bg: 'var(--gold-pale)'  },
    { label: 'Swaps completed',   value: completedCount,              icon: IconSwap,  color: 'var(--teal)',   bg: 'var(--teal-pale)'  },
    { label: 'Average rating',    value: user?.avg_rating > 0 ? user.avg_rating.toFixed(1) : '—', icon: IconStar, color: '#E8B84B', bg: 'var(--amber-pale)' },
    { label: 'Mutual matches',    value: matches.length,              icon: IconMatch, color: 'var(--navy-3)', bg: 'var(--navy-alpha)' },
  ]

  const QUICK = [
    { to: '/browse',    label: 'Browse users',  Icon: IconBrowse, color: 'var(--teal)'  },
    { to: '/matches',   label: 'View matches',  Icon: IconMatch,  color: 'var(--gold)'  },
    { to: '/swaps',     label: 'Swap requests', Icon: IconSwap,   color: 'var(--coral)' },
    { to: '/profile/me', label: 'Edit profile', Icon: IconUser,   color: 'var(--navy-3)' },
  ]

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      {/* ── Header ───────────────────────────────────── */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
            {greeting(user?.display_name)}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>{dateStr()}</p>
            {user?.badge && <TrustBadge badge={user.badge} size="sm" />}
          </div>
        </div>
        <Link to="/profile/me" className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
          <span style={{ width: 16, height: 16 }}><IconUser /></span>
          Edit profile
        </Link>
      </div>

      {/* ── Stats row ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {STATS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <div key={label} className="stat-card anim-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="stat-icon" style={{ background: bg }}>
              <span style={{ width: 20, height: 20, color }}><Icon /></span>
            </div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Active Swaps */}
        <div className="card card-p anim-fade-up delay-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Active Swaps</h2>
            <Link to="/swaps" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View all</Link>
          </div>

          {activeSwaps.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔄</div>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No active swaps</p>
              <Link to="/matches" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Find matches</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeSwaps.map((swap) => {
                const s = STATUS_COLORS[swap.status] || STATUS_COLORS.pending
                return (
                  <div key={swap.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg)', borderRadius: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
                        {swap.sender_id === user?.id ? 'Outgoing request' : 'Incoming request'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{swap.session_type}</div>
                    </div>
                    <span className="badge" style={{ background: s.bg, color: s.color, textTransform: 'capitalize' }}>
                      {swap.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Matches */}
        <div className="card card-p anim-fade-up delay-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Top Matches</h2>
            <Link to="/matches" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>All matches</Link>
          </div>

          {topMatches.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💡</div>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Add skills to get matched</p>
              <Link to="/profile/me" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Add skills</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topMatches.map((m) => (
                <Link key={m.user.id} to={`/profile/${m.user.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: '8px 10px', borderRadius: 10, transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background='var(--bg)'}
                  onMouseOut={e => e.currentTarget.style.background='transparent'}
                >
                  <Avatar src={m.user.avatar_url} name={m.user.display_name} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
                      {m.user.display_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {m.they_can_teach_me[0]?.name || 'Skills matched'}
                    </div>
                  </div>
                  <ScoreRing score={m.swap_score} size={44} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* My Skills summary */}
        <div className="card card-p anim-fade-up delay-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>My Skills</h2>
            <Link to="/profile/me" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>Manage</Link>
          </div>

          {skills.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>No skills added yet</p>
              <Link to="/profile/me" className="btn btn-ghost btn-sm">Add skills</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {offeredSkills.length > 0 && (
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Offering</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {offeredSkills.slice(0, 4).map((s) => (
                      <SkillBadge key={s.id} name={s.name} category={s.category} level={s.level} type="offered" />
                    ))}
                    {offeredSkills.length > 4 && <span className="badge badge-gray">+{offeredSkills.length - 4}</span>}
                  </div>
                </div>
              )}
              {wantedSkills.length > 0 && (
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Wanting</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {wantedSkills.slice(0, 4).map((s) => (
                      <SkillBadge key={s.id} name={s.name} category={s.category} level={s.level} type="wanted" />
                    ))}
                    {wantedSkills.length > 4 && <span className="badge badge-gray">+{wantedSkills.length - 4}</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card card-p anim-fade-up delay-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK.map(({ to, label, Icon, color }) => (
              <Link key={to} to={to}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  padding: '16px', borderRadius: 12,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ width: 20, height: 20, color }}><Icon /></span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
