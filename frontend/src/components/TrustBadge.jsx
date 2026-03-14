const BADGE_CONFIG = {
  'Top Contributor': { bg: 'var(--gold-pale)', color: '#A0701A', border: 'rgba(200,150,60,0.3)', icon: '★' },
  'Trusted Peer':    { bg: 'var(--teal-pale)', color: 'var(--teal)', border: 'rgba(26,158,143,0.25)', icon: '◆' },
  'Active Learner':  { bg: 'var(--violet-pale)', color: 'var(--violet)', border: 'rgba(123,95,212,0.25)', icon: '▲' },
  'Newcomer':        { bg: 'rgba(11,25,41,0.04)', color: 'var(--text-3)', border: 'var(--border2)', icon: '○' },
}

export default function TrustBadge({ badge, size = 'md' }) {
  const cfg = BADGE_CONFIG[badge] || BADGE_CONFIG['Newcomer']
  const isSmall = size === 'sm'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isSmall ? 3 : 4,
      fontSize: isSmall ? 10.5 : 12,
      fontWeight: 600,
      padding: isSmall ? '2px 7px' : '3px 10px',
      borderRadius: 999,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      letterSpacing: 0.1,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: isSmall ? 8 : 9 }}>{cfg.icon}</span>
      {badge}
    </span>
  )
}
