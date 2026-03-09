import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconArrowRight, IconZap, IconPeople, IconBook, IconCheck } from '../components/Icons'

const FLOATING_CARDS = [
  { style: { top: '18%', left: '6%' },       cls: 'float-1', emoji: '🐍', text: 'Python · Advanced',    sub: 'offered by 24 users' },
  { style: { top: '32%', right: '5%' },       cls: 'float-2', emoji: '∫',  text: 'Calculus · Intermediate', sub: 'wanted by 18 users' },
  { style: { bottom: '28%', left: '4%' },     cls: 'float-3', emoji: '🌍', text: 'Spanish · Beginner',   sub: 'offered by 31 users' },
  { style: { bottom: '22%', right: '7%' },    cls: 'float-4', emoji: '✏️', text: 'Essay Writing',         sub: 'wanted by 12 users' },
]

const HOW_STEPS = [
  { n: '01', title: 'Add your skills', body: 'List what you can teach — programming, mathematics, languages, design, and more. Then add what you want to learn.' },
  { n: '02', title: 'Get matched',     body: 'Our algorithm finds mutual matches: people who teach what you need AND need what you teach. A swap score ranks each match 0–100.' },
  { n: '03', title: 'Exchange & grow', body: 'Send a swap request, agree on a session format, meet up or go online, and confirm completion. Credits and ratings build your reputation.' },
]

const BENEFITS = [
  { icon: '🎯', title: 'Mutual benefit',   body: 'Both parties gain equally. No money changes hands — knowledge is the currency.' },
  { icon: '🤝', title: 'Verified swaps',   body: 'Both confirm completion before ratings unlock. The platform only rewards honest exchanges.' },
  { icon: '⚡', title: 'Smart scoring',    body: 'Swap scores factor in skill overlap, levels, deadlines, session type, and availability. Better matches first.' },
  { icon: '📈', title: 'Build reputation', body: 'Credits and ratings follow you. The more you teach, the more you earn — making your profile shine.' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Top nav ─────────────────────────────────────── */}
      <header className="land-nav">
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'var(--gold)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>S</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--text-1)' }}>StudySwap</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/browse" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}
              onMouseOver={e => e.currentTarget.style.background='rgba(11,25,41,0.06)'}
              onMouseOut={e => e.currentTarget.style.background='transparent'}>
              Browse
            </Link>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}
                  onMouseOver={e => e.currentTarget.style.background='rgba(11,25,41,0.06)'}
                  onMouseOut={e => e.currentTarget.style.background='transparent'}>
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-gold btn-sm">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="land-hero">
        {/* Background orbs */}
        <div className="hero-orb" style={{ width: 600, height: 600, background: 'var(--gold-pale)', top: -100, right: -150 }} />
        <div className="hero-orb" style={{ width: 500, height: 500, background: 'var(--teal-pale)', bottom: -80, left: -100 }} />

        {/* Floating cards — hidden on small screens */}
        {FLOATING_CARDS.map((card, i) => (
          <div key={i} className={`floating-card ${card.cls}`} style={card.style}>
            <span style={{ fontSize: 20 }}>{card.emoji}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{card.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{card.sub}</div>
            </div>
          </div>
        ))}

        {/* Hero content */}
        <div style={{ position: 'relative', maxWidth: 720, animation: 'fadeUp 0.7s var(--ease) both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--gold-pale)', border: '1px solid rgba(200,150,60,0.25)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 28,
            fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            <span style={{ width: 16, height: 16, display: 'block' }}><IconZap /></span>
            Academic Skill Exchange
          </div>

          <h1 className="text-display-xl" style={{ color: 'var(--text-1)', marginBottom: 24 }}>
            Exchange Knowledge.
            <br />
            <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Grow Together.</span>
          </h1>

          <p style={{ fontSize: 19, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 40, maxWidth: 540, margin: '0 auto 40px' }}>
            A platform where students and academics teach what they know and learn what they need — no money, no gatekeeping, just genuine knowledge exchange.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-xl" style={{ gap: 10 }}>
              Start exchanging free
              <span style={{ width: 20, height: 20 }}><IconArrowRight /></span>
            </Link>
            <Link to="/browse" className="btn btn-ghost btn-xl">
              Browse skills
            </Link>
          </div>

          <p style={{ marginTop: 28, fontSize: 13, color: 'var(--text-4)' }}>
            Already joined by <strong style={{ color: 'var(--text-2)' }}>students from 40+ universities</strong>
          </p>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-label">How it works</div>
            <h2 className="text-display-md">Three steps to your first swap</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {HOW_STEPS.map(({ n, title, body }, i) => (
              <div
                key={n}
                className="card card-p anim-fade-up"
                style={{ animationDelay: `${i * 0.12}s`, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  fontFamily: 'var(--font-display)', fontSize: 64,
                  fontWeight: 700, color: 'rgba(11,25,41,0.04)',
                  lineHeight: 1, userSelect: 'none',
                }}>
                  {n}
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--navy)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{n}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--text-1)' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-label">Why StudySwap?</div>
            <h2 className="text-display-md">Built for genuine learning</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
            {BENEFITS.map(({ icon, title, body }, i) => (
              <div
                key={title}
                className="card card-p card-hover anim-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--navy)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-display-md" style={{ color: '#fff', marginBottom: 16 }}>
            Ready to start exchanging?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 36 }}>
            Join thousands of students already growing through skill exchange.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-gold btn-xl">
              Create free account
            </Link>
            <Link to="/browse" className="btn btn-xl" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
              Explore skills
            </Link>
          </div>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {['Free forever', 'No credit card', 'Cancel anytime'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ width: 14, height: 14, color: 'var(--gold)' }}><IconCheck /></span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{ background: 'var(--navy-2)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          © {new Date().getFullYear()} StudySwap · Built for learners, by learners
        </p>
      </footer>
    </div>
  )
}
