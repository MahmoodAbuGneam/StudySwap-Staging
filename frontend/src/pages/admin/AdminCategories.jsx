import { useState, useEffect } from 'react'
import { getCategories, addCategory, deleteCategory } from '../../api/admin'
import { IconPlus, IconX, IconBook } from '../../components/Icons'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [newName, setNewName]       = useState('')
  const [adding, setAdding]         = useState(false)
  const [addError, setAddError]     = useState(null)
  const [deleting, setDeleting]     = useState({}) // name -> bool

  const load = () => {
    setLoading(true)
    getCategories()
      .then(data => {
        // API may return array of strings or array of objects
        const cats = Array.isArray(data) ? data : (data.categories || [])
        setCategories(cats)
        setError(null)
      })
      .catch(err => setError(err?.response?.data?.detail || 'Failed to load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    setAdding(true)
    setAddError(null)
    try {
      await addCategory(trimmed)
      setNewName('')
      load()
    } catch (err) {
      setAddError(err?.response?.data?.detail || 'Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return
    setDeleting(p => ({ ...p, [name]: true }))
    try {
      await deleteCategory(name)
      setCategories(prev => prev.filter(c => (typeof c === 'string' ? c : c.name) !== name))
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to delete category')
    } finally {
      setDeleting(p => ({ ...p, [name]: false }))
    }
  }

  const getCatName = (c) => typeof c === 'string' ? c : c.name

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
            Categories
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {loading ? 'Loading…' : `${categories.length} skill ${categories.length === 1 ? 'category' : 'categories'}`}
          </p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold-pale)', color: '#9A6E20', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 100 }}>
          Admin
        </span>
      </div>

      {/* Add form */}
      <div className="card card-p" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>Add New Category</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
            <input
              className="form-input"
              placeholder="Category name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              disabled={adding}
            />
          </div>
          <button
            type="submit"
            className="btn btn-gold"
            disabled={adding || !newName.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ width: 16, height: 16 }}><IconPlus /></span>
            {adding ? 'Adding…' : 'Add Category'}
          </button>
        </form>
        {addError && (
          <div className="alert alert-error" style={{ marginTop: 10 }}>{addError}</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Categories list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
          <div className="spinner" />
        </div>
      ) : categories.length === 0 ? (
        <div className="card card-p" style={{ textAlign: 'center', color: 'var(--text-3)', padding: '48px 24px' }}>
          <div style={{ width: 40, height: 40, margin: '0 auto 12px', color: 'var(--text-4)' }}><IconBook /></div>
          <p style={{ fontSize: 14 }}>No categories yet. Add one above.</p>
        </div>
      ) : (
        <div className="card card-p">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>All Categories</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {categories.map((c) => {
              const name = getCatName(c)
              return (
                <div
                  key={name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px 7px 14px',
                    borderRadius: 100,
                    background: 'var(--bg)',
                    border: '1.5px solid var(--border2)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-1)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-alpha)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <span style={{ width: 14, height: 14, color: 'var(--gold)', flexShrink: 0 }}><IconBook /></span>
                  {name}
                  <button
                    onClick={() => handleDelete(name)}
                    disabled={deleting[name]}
                    title="Delete category"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: deleting[name] ? 'not-allowed' : 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      color: deleting[name] ? 'var(--text-4)' : 'var(--coral)',
                      opacity: deleting[name] ? 0.5 : 0.7,
                      transition: 'opacity 0.12s, background 0.12s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { if (!deleting[name]) e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={e => { if (!deleting[name]) e.currentTarget.style.opacity = '0.7' }}
                  >
                    <span style={{ width: 13, height: 13 }}><IconX /></span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
