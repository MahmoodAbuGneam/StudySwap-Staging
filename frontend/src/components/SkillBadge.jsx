const CATEGORY_CLASS = {
  'Programming':      'chip-programming',
  'Mathematics':      'chip-mathematics',
  'Engineering':      'chip-engineering',
  'Languages':        'chip-languages',
  'Design':           'chip-design',
  'Academic Writing': 'chip-writing',
  'Study Skills':     'chip-study',
  'Data Science':     'chip-data',
}

const LEVEL_DOT = {
  beginner:     '#25A96E',
  intermediate: '#C8963C',
  advanced:     '#E05A4E',
}

export default function SkillBadge({ name, category = '', level, type, maxWidth }) {
  const catClass = CATEGORY_CLASS[category] || 'chip-default'
  const typeClass = type ? `chip-${type}` : ''

  return (
    <span
      className={`skill-chip ${catClass} ${typeClass}`}
      style={maxWidth ? { maxWidth } : {}}
      title={`${name}${category ? ` · ${category}` : ''}${level ? ` · ${level}` : ''}`}
    >
      {level && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: LEVEL_DOT[level] || '#A4B0C4',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {name}
    </span>
  )
}
