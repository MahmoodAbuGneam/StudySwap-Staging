import { useState, useEffect, useMemo } from 'react'
import { getSwaps } from '../../api/admin'
import { IconSwap } from '../../components/Icons'

const STATUS_BADGE = {
  pending:   { bg: 'var(--amber-pale)',        color: 'var(--amber)'  },
  accepted:  { bg: 'var(--teal-pale)',          color: 'var(--teal)'   },
  completed: { bg: 'var(--green-pale)',         color: 'var(--green)'  },
  rejected:  { bg: 'var(--coral-pale)',         color: 'var(--coral)'  },
  cancelled: { bg: 'rgba(11,25,41,0.05)',       color: 'var(--text-3)' },
}

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || { bg: 'rgba(11,25,41,0.05)', color: 'var(--text-3)' }
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

function shortId(id) {
  if (!id) return '—'
  return id.substring(0, 8)
}

export default function AdminSwaps() {
  const [swaps, setSwaps]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getSwaps()
      .then(data => {
        setSwaps(Array.isArray(data) ? data : (data.swaps || []))
        setError(null)
      })
      .catch(err => setError(err?.response?.data?.detail || 'Failed to load swaps'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return swaps
    return swaps.filter(s => s.status === statusFilter)
  }, [swaps, statusFilter])

  const STATUS_OPTIONS = ['all', 'pending', 'accepted', 'completed', 'cancelled', 'rejected']

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
            Swaps
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${swaps.length} swaps`}
          </p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold-pale)', color: '#9A6E20', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 100 }}>
          Admin
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginRight: 4 }}>Filter:</span>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
            style={{ flex: 'none', textTransform: 'capitalize', fontSize: 12, padding: '6px 14px' }}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
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
      ) : filtered.length === 0 ? (
        <div className="card card-p" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '48px 24px' }}>
          <div style={{ width: 40, height: 40, margin: '0 auto 12px', color: 'var(--text-4)' }}><IconSwap /></div>
          <p style={{ fontSize: 14 }}>No swaps found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Swap ID', 'Sender ID', 'Receiver ID', 'Status', 'Session Type'].map(h => (
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
                {filtered.map((swap, i) => (
                  <tr
                    key={swap.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.03em' }}>
                      {shortId(swap.id)}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.03em' }}>
                      {shortId(swap.sender_id)}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.03em' }}>
                      {shortId(swap.receiver_id)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={swap.status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', textTransform: 'capitalize' }}>
                      {swap.session_type || '—'}
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
