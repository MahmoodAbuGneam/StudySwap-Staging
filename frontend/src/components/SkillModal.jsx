import { useState } from 'react'
import { addOfferedSkill, addWantedSkill } from '../api/skills'
import { IconX } from './Icons'

const LEVELS = ['beginner', 'intermediate', 'advanced']

export default function SkillModal({ type, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    category: categories[0] || '',
    level: 'intermediate',
    description: '',
    deadline: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        level: form.level,
        description: form.description,
        deadline: form.deadline || null,
      }
      if (type === 'offered') await addOfferedSkill(payload)
      else await addWantedSkill(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save skill')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="modal-title" style={{ textTransform: 'capitalize' }}>
              Add {type} Skill
            </div>
            <div className="modal-sub" style={{ marginBottom: 0 }}>
              {type === 'offered' ? 'What can you teach?' : 'What do you want to learn?'}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
            <span style={{ width: 18, height: 18, display: 'block' }}><IconX /></span>
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Skill name *</label>
            <input
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              placeholder="e.g. Python, Calculus, Spanish"
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-input" value={form.level} onChange={(e) => set('level', e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l} value={l} style={{ textTransform: 'capitalize' }}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(optional)</span></label>
            <textarea
              className="form-input"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Brief description of your experience or what you're looking for..."
            />
          </div>

          {type === 'wanted' && (
            <div className="form-group">
              <label className="form-label">Deadline <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(optional)</span></label>
              <input
                className="form-input"
                type="date"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.name.trim()} className="btn btn-primary" style={{ flex: 2 }}>
              {saving ? 'Adding…' : `Add ${type} skill`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
