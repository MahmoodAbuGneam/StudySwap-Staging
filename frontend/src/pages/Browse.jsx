import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { browseUsers } from '../api/browse'
import { getCategories } from '../api/skills'
import Avatar from '../components/Avatar'
import StarRating from '../components/StarRating'
import TrustBadge from '../components/TrustBadge'
import { IconSearch } from '../components/Icons'

const LEVELS = ['beginner', 'intermediate', 'advanced']

const CATEGORY_ICONS = {
  'Programming':      '💻',
  'Mathematics':      '∑',
  'Engineering':      '⚙️',
  'Languages':        '🌍',
  'Design':           '🎨',
  'Academic Writing': '✏️',
  'Study Skills':     '📚',
  'Data Science':     '📊',
}

export default function Browse() {
  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ category: '', skill: '', level: '' })
  const [applied, setApplied] = useState({})

  useEffect(() => { getCategories().then(setCategories) }, [])

  const fetchUsers = async (params, pg = 1) => {
    setLoading(true)
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      const data = await browseUsers({ ...clean, page: pg, limit: 12 })
      setUsers(data.users)
      setTotal(data.total)
      setPages(data.pages)
      setPage(pg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers({}) }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setApplied(filters)
    fetchUsers(filters)
  }

  const handleCategoryClick = (cat) => {
    const next = filters.category === cat ? '' : cat
    const updated = { ...filters, category: next }
    setFilters(updated)
    setApplied(updated)
    fetchUsers(updated)
  }

  const clearFilters = () => {
    setFilters({ category: '', skill: '', level: '' })
    setApplied({})
    fetchUsers({})
  }

  const hasFilters = Object.values(applied).some(Boolean)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Filter sidebar ─────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0,
        padding: '32px 0 32px 36px',
        position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ marginBottom: 28 }}>
          <div className="section-label">Categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 9, border: 'none',
                  background: filters.category === cat ? 'var(--navy)' : 'transparent',
                  color: filters.category === cat ? '#fff' : 'var(--text-2)',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { if (filters.category !== cat) e.currentTarget.style.background = 'rgba(11,25,41,0.05)' }}
                onMouseOut={e => { if (filters.category !== cat) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {CATEGORY_ICONS[cat] || '📖'}
                </span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="section-label">Level</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => {
                  const next = { ...filters, level: filters.level === lv ? '' : lv }
                  setFilters(next); setApplied(next); fetchUsers(next)
                }}
                style={{
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: filters.level === lv ? 'var(--navy)' : 'transparent',
                  color: filters.level === lv ? '#fff' : 'var(--text-2)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  textAlign: 'left', textTransform: 'capitalize', transition: 'all 0.15s',
                }}
                onMouseOver={e => { if (filters.level !== lv) e.currentTarget.style.background = 'rgba(11,25,41,0.05)' }}
                onMouseOut={e => { if (filters.level !== lv) e.currentTarget.style.background = 'transparent' }}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* ── Main content ───────────────────────────── */}
      <div style={{ flex: 1, padding: '32px 36px 32px 24px', minWidth: 0 }}>
        {/* Header + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 className="text-page-title">Browse Users</h1>
            <p className="text-muted" style={{ marginTop: 4 }}>
              {loading ? 'Searching…' : `${total} user${total !== 1 ? 's' : ''} found`}
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-3)', pointerEvents: 'none' }}>
                <IconSearch />
              </span>
              <input
                className="form-input"
                type="text"
                value={filters.skill}
                onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                placeholder="Search skill name…"
                style={{ paddingLeft: 38, width: 220 }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
        </div>

        {/* Active filter pills */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {applied.category && <span className="badge badge-navy">{applied.category} ×</span>}
            {applied.level && <span className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{applied.level} ×</span>}
            {applied.skill && <span className="badge badge-navy">"{applied.skill}" ×</span>}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>No users found</p>
            <p className="text-muted">Try adjusting your filters</p>
            {hasFilters && <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>Clear filters</button>}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {users.map((u, i) => (
                <Link
                  key={u.id}
                  to={`/profile/${u.id}`}
                  className="card card-hover anim-fade-up"
                  style={{ padding: '20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 14, animationDelay: `${i * 0.04}s` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar src={u.avatar_url} name={u.display_name} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.display_name}
                      </div>
                      {u.academic_field && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.academic_field}
                        </div>
                      )}
                    </div>
                  </div>

                  {u.bio && (
                    <p className="truncate-2" style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
                      {u.bio}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <StarRating value={u.avg_rating} readonly size="sm" />
                    {u.badge && <TrustBadge badge={u.badge} size="sm" />}
                  </div>

                  {u.session_types?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      {u.session_types.map((t) => (
                        <span key={t} className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchUsers(applied, p)}
                    style={{
                      width: 36, height: 36, borderRadius: 9, border: '1.5px solid',
                      borderColor: p === page ? 'var(--navy)' : 'var(--border2)',
                      background: p === page ? 'var(--navy)' : 'var(--bg-card)',
                      color: p === page ? '#fff' : 'var(--text-2)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
