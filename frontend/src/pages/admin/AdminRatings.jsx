import { useState, useEffect } from 'react'
import { getRatings, deleteRating } from '../../api/admin'
import { IconStar, IconTrash } from '../../components/Icons'

function StarScore({ score }) {
  const n = Math.round(score ?? 0)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 13, color: i <= n ? 'var(--gold)' : 'var(--border2)' }}>★</span>
      ))}
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginLeft: 4 }}>{score?.toFixed(1) ?? '—'}</span>
    </span>
  )
}

function shortId(id) {
  if (!id) return '—'
  return id.substring(0, 8)
}

function truncate(text, max = 60) {
  if (!text) return '—'
  return text.length > max ? text.substring(0, max) + '…' : text
}

export default function AdminRatings() {
  const [ratings, setRatings]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [deleting, setDeleting] = useState({}) // ratingId -> bool

  useEffect(() => {
    setLoading(true)
    getRatings()
      .then(data => {
        setRatings(Array.isArray(data) ? data : (data.ratings || []))
        setError(null)
      })
      .catch(err => setError(err?.response?.data?.detail || 'Failed to load ratings'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (ratingId) => {
    if (!window.confirm('Delete this rating? This cannot be undone.')) return
    setDeleting(p => ({ ...p, [ratingId]: true }))
    try {
      await deleteRating(ratingId)
      setRatings(prev => prev.filter(r => r.id !== ratingId))
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to delete rating')
    } finally {
      setDeleting(p => ({ ...p, [ratingId]: false }))
    }
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
            Ratings
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {loading ? 'Loading…' : `${ratings.length} rating${ratings.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold-pale)', color: '#9A6E20', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 100 }}>
          Admin
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
          <div className="spinner" />
        </div>
      ) : ratings.length === 0 ? (
        <div className="card card-p" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '48px 24px' }}>
          <div style={{ width: 40, height: 40, margin: '0 auto 12px', color: 'var(--text-4)' }}><IconStar /></div>
          <p style={{ fontSize: 14 }}>No ratings yet</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Swap ID', 'Rater ID', 'Ratee ID', 'Score', 'Review', 'Tags', 'Delete'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: 'var(--text-3)',
                      whiteSpace: 'nowrap',
                      background: 'var(--bg)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ratings.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: i < ratings.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Swap ID */}
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                      {shortId(r.swap_id)}
                    </td>
                    {/* Rater ID */}
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                      {shortId(r.rater_id)}
                    </td>
                    {/* Ratee ID */}
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                      {shortId(r.ratee_id)}
                    </td>
                    {/* Score */}
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <StarScore score={r.score} />
                    </td>
                    {/* Review */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', maxWidth: 240 }}>
                      <span title={r.review || ''} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {truncate(r.review, 55)}
                      </span>
                    </td>
                    {/* Tags */}
                    <td style={{ padding: '12px 16px', maxWidth: 180 }}>
                      {r.tags && r.tags.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="badge badge-navy" style={{ fontSize: 10 }}>{tag}</span>
                          ))}
                          {r.tags.length > 3 && (
                            <span className="badge badge-gray" style={{ fontSize: 10 }}>+{r.tags.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-4)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    {/* Delete */}
                    <td style={{ padding: '10px 16px' }}>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        disabled={deleting[r.id]}
                        onClick={() => handleDelete(r.id)}
                        title="Delete rating"
                      >
                        <span style={{ width: 14, height: 14 }}><IconTrash /></span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
