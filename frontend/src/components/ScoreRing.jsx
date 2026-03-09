import { useEffect, useRef, useState } from 'react'

const SIZE = 72
const RADIUS = 28
const CIRC = 2 * Math.PI * RADIUS

function scoreColor(score) {
  if (score >= 70) return '#25A96E'
  if (score >= 40) return '#C8963C'
  return '#E05A4E'
}

export default function ScoreRing({ score = 0, size = 72 }) {
  const [animated, setAnimated] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    let start = null
    const duration = 900
    const from = 0
    const to = score

    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimated(Math.round(from + (to - from) * ease))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [score])

  const offset = CIRC - (animated / 100) * CIRC
  const color = scoreColor(score)
  const scale = size / SIZE

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id={`sg-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none"
          stroke="rgba(11,25,41,0.07)"
          strokeWidth="5.5"
        />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none"
          stroke={`url(#sg-${score})`}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <div className="score-ring-label" style={{ fontSize: 13 * scale }}>
        <div style={{ fontWeight: 800, color, fontSize: 14 * scale }}>{animated}</div>
        <div style={{ fontSize: 9 * scale, color: 'var(--text-4)', fontWeight: 600 }}>score</div>
      </div>
    </div>
  )
}
