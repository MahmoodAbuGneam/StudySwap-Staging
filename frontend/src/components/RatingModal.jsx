import { useState } from 'react'
import { submitRating } from '../api/ratings'
import StarRating from './StarRating'
import { IconX } from './Icons'

const TAGS = ['helpfulness', 'clarity', 'reliability', 'communication']

export default function RatingModal({ swap, myId, onClose, onRated }) {
  const rateeId = swap.sender_id === myId ? swap.receiver_id : swap.sender_id

  const [score, setScore] = useState(0)
  const [review, setReview] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleTag = (tag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!score) return setError('Please select a star rating')
    setError('')
    setSaving(true)
    try {
      await submitRating({ swap_id: swap.id, ratee_id: rateeId, score, review, tags: selectedTags })
      onRated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit rating')
      setSaving(false)
    }
  }

  const SCORE_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div className="modal-title">Rate this swap</div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
            <span style={{ width: 18, height: 18, display: 'block' }}><IconX /></span>
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stars */}
          <div style={{ textAlign: 'center' }}>
            <div className="form-label" style={{ marginBottom: 12 }}>Overall Rating</div>
            <StarRating value={score} onChange={setScore} size="lg" />
            {score > 0 && (
              <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: '#E8B84B' }}>
                {SCORE_LABELS[score]}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="form-label" style={{ marginBottom: 10 }}>Highlight qualities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`btn btn-sm ${selectedTags.includes(tag) ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Review */}
          <div className="form-group">
            <label className="form-label">
              Review <span style={{ fontWeight: 400, color: 'var(--text-4)' }}>(optional)</span>
            </label>
            <textarea
              className="form-input"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              placeholder="Share your experience with this swap partner…"
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !score}
              className="btn btn-gold"
              style={{ flex: 2 }}
            >
              {saving ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
