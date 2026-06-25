import { useState, useEffect } from 'react'
import { getBudgets, createBudget, deleteBudget } from '../services/budgetService'
import { formatPKR } from '../utils/formatCurrency'
import { getCurrentMonth } from '../utils/formatDate'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

const STATUS_COLOR = { safe: '#10b981', nearLimit: '#f59e0b', exceeded: '#ef4444' }
const STATUS_LABEL = { safe: 'On Track', nearLimit: 'Near Limit', exceeded: 'Exceeded' }

function BudgetForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ month: getCurrentMonth(), totalLimit: '', warningThreshold: 75 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.totalLimit || form.totalLimit <= 0) { setError('Budget limit must be greater than 0'); return }
    setLoading(true)
    try {
      await createBudget(form)
      toast.success('Budget created!')
      onSave()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Create Budget</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Month</label>
            <input className="form-control" type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Total Budget Limit (PKR)</label>
            <input className="form-control" type="number" min="1" placeholder="50000" value={form.totalLimit} onChange={e => { setForm({ ...form, totalLimit: e.target.value }); setError('') }} />
          </div>
          <div className="form-group">
            <label className="form-label">Warning Threshold (%)</label>
            <input className="form-control" type="number" min="1" max="99" value={form.warningThreshold} onChange={e => setForm({ ...form, warningThreshold: e.target.value })} />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Alert when spending reaches this % of budget</small>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Creating...' : 'Create Budget'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  const fetch = () => {
    setLoading(true)
    getBudgets()
      .then(res => setBudgets(res.data.budgets))
      .catch(() => toast.error('Failed to load budgets'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return
    try { await deleteBudget(id); toast.success('Budget deleted'); fetch() }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><FiPlus /> Set Budget</button>
      </div>

      {loading ? <LoadingSpinner /> : budgets.length === 0 ? (
        <div className="empty-state card" style={{ padding: '3rem' }}>
          <p>No budgets set. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setShowForm(true)}>Create your first budget</span></p>
        </div>
      ) : (
        <div className="grid-2">
          {budgets.map(b => {
            const pct = b.totalLimit > 0 ? Math.min(100, Math.round((b.spentAmount / b.totalLimit) * 100)) : 0
            return (
              <div key={b._id} className="card">
                <div className="card-header">
                  <div>
                    <h3>{b.month}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatPKR(b.spentAmount)} of {formatPKR(b.totalLimit)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: STATUS_COLOR[b.status] + '20', color: STATUS_COLOR[b.status] }}>
                      ● {STATUS_LABEL[b.status]}
                    </span>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b._id)}><FiTrash2 /></button>
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>{pct}% used</span>
                    <span style={{ color: 'var(--text-muted)' }}>Remaining: {formatPKR(Math.max(0, b.totalLimit - b.spentAmount))}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${b.status}`} style={{ width: `${pct}%` }} />
                  </div>
                  {b.status !== 'safe' && (
                    <div className={`alert ${b.status === 'exceeded' ? 'alert-error' : 'alert-warning'}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                      {b.status === 'exceeded' ? '⚠ Budget exceeded! You have gone over your limit.' : `⚠ Budget near limit (${pct}%). Slow down spending.`}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && <BudgetForm onSave={() => { setShowForm(false); fetch() }} onCancel={() => setShowForm(false)} />}
    </div>
  )
}
