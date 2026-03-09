export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const sizes = { sm: 16, md: 22, lg: 28 }
  const px = sizes[size] || 22

  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className="star-btn"
          style={{
            fontSize: px,
            color: star <= Math.round(value) ? '#E8B84B' : 'rgba(11,25,41,0.12)',
            cursor: readonly ? 'default' : 'pointer',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}
