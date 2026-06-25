import { useState, useEffect, useCallback } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService'
import { formatPKR } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import { getCurrentMonth } from '../utils/formatDate'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'

const CATEGORIES = ['Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities', 'Entertainment', 'Healthcare', 'Education', 'Other']

function ExpenseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', amount: '', category: 'Food & Dining', paymentMethod: 'wallet', date: new Date().toISOString().slice(0, 10), notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.amount) { setError('Title and amount are required'); return }
    setLoading(true)
    try {
      if (initial?._id) await updateExpense(initial._id, form)
      else await createExpense(form)
      toast.success(initial ? 'Expense updated' : 'Expense added')
      onSave()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 className="modal-title">{initial ? 'Edit Expense' : 'Add Expense'}</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-control" placeholder="e.g. Lunch" value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); setError('') }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Amount (PKR)</label>
              <input className="form-control" type="number" min="1" value={form.amount} onChange={e => { setForm({ ...form, amount: e.target.value }); setError('') }} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-control" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-control" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="wallet">Wallet</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input className="form-control" placeholder="Any notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : (initial ? 'Update' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [catFilter, setCatFilter] = useState('')
  const toast = useToast()

  const fetch = useCallback(() => {
    setLoading(true)
    const params = catFilter ? { category: catFilter } : {}
    getExpenses(params)
      .then(res => setExpenses(res.data.expenses))
      .catch(() => toast.error('Failed to load expenses'))
      .finally(() => setLoading(false))
  }, [catFilter])

  useEffect(() => { fetch() }, [fetch])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await deleteExpense(id)
      toast.success('Deleted')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const totalThisMonth = expenses
    .filter(e => e.date?.startsWith(getCurrentMonth()))
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>This month: {formatPKR(totalThisMonth)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true) }}>
          <FiPlus /> Add Expense
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${!catFilter ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCatFilter('')}>All</button>
          {CATEGORIES.map(c => (
            <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCatFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : expenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses found. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setShowForm(true)}>Add your first one</span></p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Method</th><th></th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e._id}>
                    <td>{e.title}</td>
                    <td><span className="badge badge-secondary">{e.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatPKR(e.amount)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(e.date)}</td>
                    <td>{e.paymentMethod}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => { setEditItem(e); setShowForm(true) }}><FiEdit2 /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e._id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          initial={editItem}
          onSave={() => { setShowForm(false); setEditItem(null); fetch() }}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
        />
      )}
    </div>
  )
}
