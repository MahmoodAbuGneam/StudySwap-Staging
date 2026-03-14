import { useState, useEffect, useMemo } from 'react'
import { getUsers, updateUserStatus, deleteUser } from '../../api/admin'
import { IconSearch, IconTrash, IconUser } from '../../components/Icons'
import { useAuth } from '../../context/AuthContext'

const PROTECTED_ADMIN_EMAIL = 'administrator@gmail.com'

const STATUS_BADGE = {
  active:    { bg: 'var(--green-pale)',  color: 'var(--green)',  label: 'Active'    },
  suspended: { bg: 'var(--amber-pale)',  color: 'var(--amber)',  label: 'Suspended' },
  disabled:  { bg: 'var(--coral-pale)',  color: 'var(--coral)',  label: 'Disabled'  },
}

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || { bg: 'rgba(11,25,41,0.05)', color: 'var(--text-3)', label: status }
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, textTransform: 'capitalize' }}>
      {s.label}
    </span>
  )
}

function StarDisplay({ rating }) {
  if (!rating || rating === 0) return <span style={{ color: 'var(--text-4)', fontSize: 13 }}>—</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13 }}>
      <span style={{ color: 'var(--gold)' }}>★</span>
      <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pendingStatus, setPendingStatus] = useState({}) // userId -> selected status
  const [updating, setUpdating]     = useState({})       // userId -> bool
  const [deleting, setDeleting]     = useState({})       // userId -> bool

  useEffect(() => {
    setLoading(true)
    getUsers()
      .then(data => {
        setUsers(Array.isArray(data) ? data : (data.users || []))
        setError(null)
      })
      .catch(err => setError(err?.response?.data?.detail || 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search ||
        u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [users, search, statusFilter])

  const handleUpdateStatus = async (userId) => {
    const newStatus = pendingStatus[userId]
    if (!newStatus) return
    setUpdating(p => ({ ...p, [userId]: true }))
    try {
      await updateUserStatus(userId, newStatus)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u))
      setPendingStatus(p => { const n = { ...p }; delete n[userId]; return n })
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to update status')
    } finally {
      setUpdating(p => ({ ...p, [userId]: false }))
    }
  }

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return
    setDeleting(p => ({ ...p, [userId]: true }))
    try {
      await deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to delete user')
    } finally {
      setDeleting(p => ({ ...p, [userId]: false }))
    }
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
            Users
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${users.length} users`}
          </p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold-pale)', color: '#9A6E20', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 100 }}>
          Admin
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180, maxWidth: 340 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-4)', pointerEvents: 'none' }}>
            <IconSearch />
          </span>
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card card-p" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '48px 24px' }}>
          <div style={{ width: 40, height: 40, margin: '0 auto 12px', color: 'var(--text-4)' }}><IconUser /></div>
          <p style={{ fontSize: 14 }}>No users found</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Credits', 'Rating', 'Actions'].map(h => (
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
                {filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Name */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                      {u.display_name || '—'}
                    </td>
                    {/* Email */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </td>
                    {/* Role */}
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-navy" style={{ textTransform: 'capitalize' }}>{u.role || 'user'}</span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={u.status || 'active'} />
                    </td>
                    {/* Credits */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', fontWeight: 500 }}>
                      {u.credits ?? 0}
                    </td>
                    {/* Rating */}
                    <td style={{ padding: '12px 16px' }}>
                      <StarDisplay rating={u.avg_rating} />
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select
                          className="form-input"
                          style={{ fontSize: 12, padding: '6px 10px', width: 'auto', minWidth: 120 }}
                          value={pendingStatus[u.id] ?? u.status ?? 'active'}
                          onChange={e => setPendingStatus(p => ({ ...p, [u.id]: e.target.value }))}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="disabled">Disabled</option>
                        </select>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!pendingStatus[u.id] || pendingStatus[u.id] === u.status || updating[u.id]}
                          onClick={() => handleUpdateStatus(u.id)}
                        >
                          {updating[u.id] ? '…' : 'Set'}
                        </button>
                        {(() => {
                          const isProtected = u.email === PROTECTED_ADMIN_EMAIL
                          const isSelf      = u.id === currentUser?.id
                          const disabled    = deleting[u.id] || isProtected || isSelf
                          const title       = isProtected
                            ? 'The main administrator account cannot be deleted'
                            : isSelf
                            ? 'You cannot delete your own account'
                            : 'Delete user'
                          return (
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              disabled={disabled}
                              onClick={() => !disabled && handleDelete(u.id, u.display_name)}
                              title={title}
                              style={disabled && !deleting[u.id] ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                            >
                              <span style={{ width: 14, height: 14 }}><IconTrash /></span>
                            </button>
                          )
                        })()}
                      </div>
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
