import { useState, useEffect } from 'react'
import { getMySkills } from '../api/skills'
import { createSwap } from '../api/swaps'
import { IconX, IconCheck } from './Icons'
import Avatar from './Avatar'

const SESSION_TYPES = ['online', 'in-person', 'hybrid']

export default function SwapRequestModal({ recipient, matchData, onClose }) {
  const [mySkills, setMySkills] = useState([])
  const [form, setForm] = useState({
    offered_skill_id: '',
    wanted_skill_id: '',
    message: '',
    session_type: 'online',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    getMySkills().then((skills) => {
      setMySkills(skills)
      const firstOffered = skills.find((s) => s.type === 'offered')
      if (firstOffered) setForm((f) => ({ ...f, offered_skill_id: firstOffered.id }))
    })
  }, [])

  useEffect(() => {
    if (matchData) {
      if (matchData.i_can_teach_them?.[0])
        setForm((f) => ({ ...f, offered_skill_id: matchData.i_can_teach_them[0].id }))
      if (matchData.they_can_teach_me?.[0])
        setForm((f) => ({ ...f, wanted_skill_id: matchData.they_can_teach_me[0].id }))
    }
  }, [matchData])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const offeredSkills = mySkills.filter((s) => s.type === 'offered')
  const recipientOffered = matchData?.they_can_teach_me || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.offered_skill_id || !form.wanted_skill_id) {
      setError('Please select both skills')
      return
    }
    setError('')
    setSaving(true)
    try {
      await createSwap({
        receiver_id: recipient.id,
        offered_skill_id: form.offered_skill_id,
        wanted_skill_id: form.wanted_skill_id,
        message: form.message,
        session_type: form.session_type,
      })
      setDone(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send request')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="modal-title">Request Swap</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Avatar src={recipient.avatar_url} name={recipient.display_name} size="xs" />
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                with {recipient.display_name}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
            <span style={{ width: 18, height: 18, display: 'block' }}><IconX /></span>
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--green-pale)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'var(--green)',
            }}>
              <span style={{ width: 28, height: 28 }}><IconCheck /></span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Request Sent!</div>
            <div className="text-muted">Waiting for {recipient.display_name} to respond.</div>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Skill I'm offering</label>
                <select
                  className="form-input"
                  value={form.offered_skill_id}
                  onChange={(e) => set('offered_skill_id', e.target.value)}
                  required
                >
                  <option value="">Select a skill I offer…</option>
                  {offeredSkills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {s.level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Skill I want from them</label>
                <select
                  className="form-input"
                  value={form.wanted_skill_id}
                  onChange={(e) => set('wanted_skill_id', e.target.value)}
                  required
                >
                  <option value="">Select their skill…</option>
                  {recipientOffered.length > 0
                    ? recipientOffered.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} · {s.level}</option>
                      ))
                    : <option value="" disabled>No matched skills</option>
                  }
                </select>
              </div>

              {/* Session type */}
              <div className="form-group">
                <label className="form-label">Session type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SESSION_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('session_type', t)}
                      className={`btn btn-sm ${form.session_type === t ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Message <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(optional)</span></label>
                <textarea
                  className="form-input"
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  rows={3}
                  placeholder="Introduce yourself and explain what you're looking for…"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-gold" style={{ flex: 2 }}>
                  {saving ? 'Sending…' : 'Send Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
