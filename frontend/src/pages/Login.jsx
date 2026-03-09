import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      login(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'var(--font-body)',
    }}>
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

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1.2, marginBottom: 20 }}>
            Knowledge is the <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>new currency.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Sign back in to continue your skill exchanges, check your matches, and grow your academic network.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { n: '2,400+', l: 'Active students' },
            { n: '840+',   l: 'Swaps completed' },
            { n: '4.8',    l: 'Average rating' },
          ].map(({ n, l }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--gold)' }}>{n}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="lg:hidden flex">
            <div style={{ width: 28, height: 28, background: 'var(--gold)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--navy)' }}>S</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>StudySwap</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 32 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Join free</Link>
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, marginTop: 4 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: 13, color: 'var(--text-4)', textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
