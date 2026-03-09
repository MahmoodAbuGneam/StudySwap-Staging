export default function Avatar({ src, name = '?', size = 'md', className = '' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar avatar-${size} ${className}`}
      />
    )
  }

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {initial}
    </div>
  )
}
