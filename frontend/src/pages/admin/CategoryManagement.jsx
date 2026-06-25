import { useState, useEffect } from 'react'
import { getCategories, createCategory, disableCategory } from '../../services/adminService'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FiPlus } from 'react-icons/fi'

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'expense', description: '' })
  const [formLoading, setFormLoading] = useState(false)
  const toast = useToast()

  const fetch = () => {
    setLoading(true)
    getCategories()
      .then(res => setCategories(res.data.categories))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name) { toast.error('Name is required'); return }
    setFormLoading(true)
    try {
      await createCategory(form)
      toast.success('Category created')
      setShowForm(false)
      setForm({ name: '', type: 'expense', description: '' })
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create')
    } finally { setFormLoading(false) }
  }

  const handleDisable = async (id) => {
    if (!window.confirm('Disable this category?')) return
    try { await disableCategory(id); toast.success('Category disabled'); fetch() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Category Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><FiPlus /> Add Category</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><h3>New Category</h3></div>
          <div className="card-body">
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="expense">Expense</option>
                  <option value="transaction">Transaction</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? '...' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <LoadingSpinner /> : categories.length === 0 ? (
          <div className="empty-state"><p>No categories yet</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td><span className="badge badge-secondary">{c.type}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.description || '-'}</td>
                    <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>{c.isActive ? 'Active' : 'Disabled'}</span></td>
                    <td>
                      {c.isActive && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDisable(c._id)}>Disable</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
