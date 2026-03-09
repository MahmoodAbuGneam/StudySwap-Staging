import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateMe } from '../api/users'
import { getMySkills, addOfferedSkill, addWantedSkill, deleteSkill, getCategories } from '../api/skills'
import Avatar from '../components/Avatar'
import SkillBadge from '../components/SkillBadge'
import SkillModal from '../components/SkillModal'
import StarRating from '../components/StarRating'
import { IconPlus, IconTrash, IconEdit, IconCoin } from '../components/Icons'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SESSION_TYPES = ['online', 'in-person', 'hybrid']

export default function ProfileMe() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({ display_name: '', bio: '', academic_field: '', avatar_url: '', session_types: [], availability: [] })
  const [skills, setSkills] = useState([])
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('offered')
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [skillType, setSkillType] = useState('offered')

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || '',
        bio: user.bio || '',
        academic_field: user.academic_field || '',
        avatar_url: user.avatar_url || '',
        session_types: user.session_types || [],
        availability: user.availability || [],
      })
    }
  }, [user])

  useEffect(() => {
    getMySkills().then(setSkills)
    getCategories().then(setCategories)
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateMe(form)
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const toggleSessionType = (t) =>
    set('session_types', form.session_types.includes(t) ? form.session_types.filter((x) => x !== t) : [...form.session_types, t])

  const toggleDay = (day) => {
    const exists = form.availability.find((a) => a.day === day)
    set('availability', exists
      ? form.availability.filter((a) => a.day !== day)
      : [...form.availability, { day, from: '09:00', to: '17:00' }]
    )
  }

  const updateTime = (day, field, value) =>
    set('availability', form.availability.map((a) => a.day === day ? { ...a, [field]: value } : a))

  const handleSkillAdded = async () => {
    setSkills(await getMySkills())
    setShowSkillModal(false)
  }

  const handleDelete = async (id) => {
    await deleteSkill(id)
    setSkills((prev) => prev.filter((s) => s.id !== id))
  }

  const offered = skills.filter((s) => s.type === 'offered')
  const wanted  = skills.filter((s) => s.type === 'wanted')
  const tabSkills = activeTab === 'offered' ? offered : wanted

  if (!user) return null

  return (
    <div className="page-wrapper">
      {/* ── Header ───────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-page-title">My Profile</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            {user.credits} credit{user.credits !== 1 ? 's' : ''} earned
            {user.avg_rating > 0 ? ` · ★ ${user.avg_rating.toFixed(1)} avg rating` : ''}
          </p>
        </div>
        <button
          form="profile-form"
          type="submit"
          disabled={saving}
          className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
          style={{ gap: 6 }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* ── Profile form ─────────────────────────── */}
        <form id="profile-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Avatar + basic */}
          <div className="card card-p">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text-1)' }}>Basic Information</h2>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <Avatar src={form.avatar_url} name={form.display_name || user.display_name} size="xl" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Avatar URL</label>
                  <input className="form-input" type="url" value={form.avatar_url} onChange={(e) => set('avatar_url', e.target.value)} placeholder="https://…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Name *</label>
                  <input className="form-input" type="text" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} required />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Academic Field</label>
                <input className="form-input" type="text" value={form.academic_field} onChange={(e) => set('academic_field', e.target.value)} placeholder="e.g. Computer Science" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Bio</label>
                <textarea className="form-input" value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} placeholder="Tell others about yourself, your experience, and what you're looking for…" />
              </div>
            </div>
          </div>

          {/* Session types */}
          <div className="card card-p">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-1)' }}>Session Preferences</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              {SESSION_TYPES.map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => toggleSessionType(t)}
                  className={`btn btn-sm ${form.session_types.includes(t) ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="card card-p">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-1)' }}>Availability</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.map((day) => {
                const avail = form.availability.find((a) => a.day === day)
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        width: 92, padding: '6px 0', fontSize: 12, fontWeight: 600,
                        borderRadius: 8, border: '1.5px solid',
                        borderColor: avail ? 'var(--navy)' : 'var(--border2)',
                        background: avail ? 'var(--navy)' : 'transparent',
                        color: avail ? '#fff' : 'var(--text-3)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>
                    {avail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <input type="time" value={avail.from} onChange={(e) => updateTime(day, 'from', e.target.value)} className="form-input" style={{ width: 'auto', padding: '5px 8px', fontSize: 12 }} />
                        <span style={{ color: 'var(--text-4)' }}>–</span>
                        <input type="time" value={avail.to} onChange={(e) => updateTime(day, 'to', e.target.value)} className="form-input" style={{ width: 'auto', padding: '5px 8px', fontSize: 12 }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </form>

        {/* ── Skills panel ──────────────────────────── */}
        <div className="card card-p" style={{ position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Skills</h2>
            <button
              onClick={() => { setSkillType(activeTab); setShowSkillModal(true) }}
              className="btn btn-gold btn-sm"
              style={{ gap: 5 }}
            >
              <span style={{ width: 14, height: 14 }}><IconPlus /></span>
              Add
            </button>
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn ${activeTab === 'offered' ? 'active' : ''}`} onClick={() => setActiveTab('offered')}>
              Offering ({offered.length})
            </button>
            <button className={`tab-btn ${activeTab === 'wanted' ? 'active' : ''}`} onClick={() => setActiveTab('wanted')}>
              Wanting ({wanted.length})
            </button>
          </div>

          {tabSkills.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>
                No {activeTab} skills yet
              </p>
              <button
                onClick={() => { setSkillType(activeTab); setShowSkillModal(true) }}
                className="btn btn-ghost btn-sm"
              >
                Add {activeTab} skill
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
              {tabSkills.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '10px 12px', background: 'var(--bg)', borderRadius: 10,
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 4 }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <SkillBadge name={s.category} size="xs" />
                      <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize', alignSelf: 'center' }}>{s.level}</span>
                    </div>
                    {s.deadline && (
                      <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4 }}>⏰ Due {s.deadline}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--text-4)', flexShrink: 0 }}
                    title="Remove"
                  >
                    <span style={{ width: 14, height: 14 }}><IconTrash /></span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSkillModal && (
        <SkillModal
          type={skillType}
          categories={categories}
          onClose={() => setShowSkillModal(false)}
          onSaved={handleSkillAdded}
        />
      )}
    </div>
  )
}
