import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', display_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiRegister(form)
      login(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-body)' }}>
      {/* Left panel */}
      <div style={{
        flex: '0 0 420px',
        background: 'var(--navy)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
      }}
        className="hidden lg:flex"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <div style={{ width: 32, height: 32, background: 'var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>S</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: '#fff' }}>StudySwap</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: '#fff', lineHeight: 1.25, marginBottom: 20 }}>
            Teach what you know. <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Learn what you need.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            StudySwap matches you with peers who can teach you exactly what you're looking for — while you teach them what you know.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            '✓  Add your offered and wanted skills',
            '✓  Get matched with mutual swap partners',
            '✓  Exchange sessions online or in person',
            '✓  Earn credits and build your reputation',
          ].map((line) => (
            <p key={line} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{line}</p>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="lg:hidden flex">
            <div style={{ width: 28, height: 28, background: 'var(--gold)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)' }}>S</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>StudySwap</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 32 }}>
            Already a member?{' '}
            <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                className="form-input"
                type="text"
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
                required
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                placeholder="you@university.edu"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-gold"
              style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.6 }}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-4)', textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
