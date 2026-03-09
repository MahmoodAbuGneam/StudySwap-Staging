import { useState, useEffect } from 'react'
import { listSwaps, acceptSwap, rejectSwap, confirmSwap, cancelSwap } from '../api/swaps'
import { getUserSkills } from '../api/skills'
import { getUser } from '../api/users'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import RatingModal from '../components/RatingModal'
import { IconCheck, IconX, IconSwap, IconStar } from '../components/Icons'

const STATUS = {
  pending:   { label: 'Pending',   cls: 'status-pending'   },
  accepted:  { label: 'Accepted',  cls: 'status-accepted'  },
  completed: { label: 'Completed', cls: 'status-completed' },
  rejected:  { label: 'Rejected',  cls: 'status-rejected'  },
  cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
}

function usePartnerInfo(userId) {
  const [partner, setPartner] = useState(null)
  const [skills, setSkills] = useState([])
  useEffect(() => {
    if (!userId) return
    getUser(userId).then(setPartner).catch(() => {})
    getUserSkills(userId).then(setSkills).catch(() => {})
  }, [userId])
  return { partner, skills }
}

function SwapCard({ swap, myId, onAction, onRate }) {
  const isReceiver = swap.receiver_id === myId
  const partnerId  = isReceiver ? swap.sender_id : swap.receiver_id
  const { partner, skills } = usePartnerInfo(partnerId)

  const offeredSkill = skills.find((s) => s.id === swap.offered_skill_id)?.name || `Skill #${swap.offered_skill_id.slice(-4)}`
  const wantedSkill  = skills.find((s) => s.id === swap.wanted_skill_id)?.name  || `Skill #${swap.wanted_skill_id.slice(-4)}`

  const iConfirmed = isReceiver ? swap.receiver_confirmed : swap.sender_confirmed
  const s = STATUS[swap.status] || STATUS.pending

  return (
    <div className="swap-card">
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Partner avatar */}
        <div style={{ flexShrink: 0 }}>
          <Avatar src={partner?.avatar_url} name={partner?.display_name || '?'} size="md" />
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
              {partner?.display_name || 'Loading…'}
            </span>
            <span className={`badge ${s.cls}`}>{s.label}</span>
            <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{swap.session_type}</span>
            <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 'auto' }}>
              {isReceiver ? 'incoming' : 'outgoing'}
            </span>
          </div>

          {/* Skill exchange visual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ padding: '5px 10px', background: 'var(--teal-pale)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>
              {isReceiver ? wantedSkill : offeredSkill}
            </div>
            <span style={{ width: 20, height: 20, color: 'var(--text-3)' }}><IconSwap /></span>
            <div style={{ padding: '5px 10px', background: 'var(--gold-pale)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>
              {isReceiver ? offeredSkill : wantedSkill}
            </div>
          </div>

          {swap.message && (
            <p style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic', borderLeft: '3px solid var(--border2)', paddingLeft: 10, marginBottom: 10, lineHeight: 1.6 }}>
              "{swap.message}"
            </p>
          )}

          {/* Confirmation status (accepted swaps) */}
          {swap.status === 'accepted' && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
              <span style={{ color: swap.sender_confirmed ? 'var(--green)' : 'var(--text-4)' }}>
                {swap.sender_confirmed ? '✓' : '○'} Sender confirmed
              </span>
              <span style={{ color: swap.receiver_confirmed ? 'var(--green)' : 'var(--text-4)' }}>
                {swap.receiver_confirmed ? '✓' : '○'} Receiver confirmed
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {isReceiver && swap.status === 'pending' && (
            <>
              <button onClick={() => onAction('accept', swap.id)} className="btn btn-success btn-sm" style={{ gap: 5 }}>
                <span style={{ width: 13, height: 13 }}><IconCheck /></span>
                Accept
              </button>
              <button onClick={() => onAction('reject', swap.id)} className="btn btn-danger btn-sm" style={{ gap: 5 }}>
                <span style={{ width: 13, height: 13 }}><IconX /></span>
                Reject
              </button>
            </>
          )}
          {swap.status === 'accepted' && !iConfirmed && (
            <button onClick={() => onAction('confirm', swap.id)} className="btn btn-primary btn-sm" style={{ gap: 5 }}>
              <span style={{ width: 13, height: 13 }}><IconCheck /></span>
              Mark Done
            </button>
          )}
          {['pending', 'accepted'].includes(swap.status) && (
            <button onClick={() => onAction('cancel', swap.id)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          )}
          {swap.status === 'completed' && (
            <button onClick={() => onRate(swap)} className="btn btn-sm" style={{ background: 'var(--gold-pale)', color: 'var(--gold)', border: '1px solid rgba(200,150,60,0.25)', gap: 5 }}>
              <span style={{ width: 13, height: 13 }}><IconStar /></span>
              Rate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Swaps() {
  const { user } = useAuth()
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('received')
  const [ratingSwap, setRatingSwap] = useState(null)

  const fetchSwaps = async () => {
    setLoading(true)
    try { setSwaps(await listSwaps()) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSwaps() }, [])

  const myId = user?.id
  const received = swaps.filter((s) => s.receiver_id === myId)
  const sent     = swaps.filter((s) => s.sender_id === myId)
  const displayed = tab === 'received' ? received : sent

  const handleAction = async (action, id) => {
    try {
      if (action === 'accept')  await acceptSwap(id)
      if (action === 'reject')  await rejectSwap(id)
      if (action === 'confirm') await confirmSwap(id)
      if (action === 'cancel')  await cancelSwap(id)
      await fetchSwaps()
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed')
    }
  }

  return (
    <div className="page-wrapper">
      {/* ── Header ───────────────────────────────────── */}
      <div className="page-header">
        <h1 className="text-page-title">Swap Requests</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>
          Manage your incoming and outgoing skill exchanges
        </p>
      </div>

      {/* ── Stats row ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Received',  value: received.length,                                          color: 'var(--teal)'  },
          { label: 'Sent',      value: sent.length,                                              color: 'var(--gold)'  },
          { label: 'Active',    value: swaps.filter((s) => s.status === 'accepted').length,      color: 'var(--navy-3)' },
          { label: 'Completed', value: swaps.filter((s) => s.status === 'completed').length,     color: 'var(--green)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '10px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="tabs" style={{ maxWidth: 280, marginBottom: 24 }}>
        <button className={`tab-btn ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
          Received ({received.length})
        </button>
        <button className={`tab-btn ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
          Sent ({sent.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="card anim-fade-up">
          <div className="empty-state">
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {tab === 'received' ? '📬' : '📤'}
            </div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>No {tab} requests</p>
            <p className="text-muted">
              {tab === 'received'
                ? 'When someone sends you a swap request, it appears here.'
                : 'Send a swap request from a match or profile page.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map((swap, i) => (
            <div key={swap.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <SwapCard swap={swap} myId={myId} onAction={handleAction} onRate={setRatingSwap} />
            </div>
          ))}
        </div>
      )}

      {ratingSwap && (
        <RatingModal
          swap={ratingSwap}
          myId={myId}
          onClose={() => setRatingSwap(null)}
          onRated={() => { setRatingSwap(null); fetchSwaps() }}
        />
      )}
    </div>
  )
}
