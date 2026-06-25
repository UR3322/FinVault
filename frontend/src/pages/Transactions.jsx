import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactions } from '../services/transactionService'
import { formatPKR } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiFilter, FiAlertTriangle } from 'react-icons/fi'

const STATUS_BADGE = { successful: 'badge-success', failed: 'badge-danger', flagged: 'badge-warning', pending: 'badge-secondary' }
const TYPE_BADGE = { deposit: 'badge-success', withdrawal: 'badge-danger', transfer: 'badge-info' }

export default function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', status: '', startDate: '', endDate: '', search: '', page: 1 })

  const fetchTxns = (f = filters) => {
    setLoading(true)
    const params = {}
    if (f.type)      params.type = f.type
    if (f.status)    params.status = f.status
    if (f.startDate) params.startDate = f.startDate
    if (f.endDate)   params.endDate = f.endDate
    if (f.search)    params.search = f.search
    params.page = f.page

    getTransactions(params)
      .then(res => { setTransactions(res.data.transactions); setPagination(res.data.pagination) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTxns() }, [])

  const applyFilters = () => { const f = { ...filters, page: 1 }; setFilters(f); fetchTxns(f) }
  const resetFilters = () => { const f = { type: '', status: '', startDate: '', endDate: '', search: '', page: 1 }; setFilters(f); fetchTxns(f) }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Transactions</h1>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Type</label>
              <select className="form-control" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All Status</option>
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <input type="date" className="form-control" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search</label>
              <input type="text" className="form-control" placeholder="Search description..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={applyFilters}><FiFilter size={14} /> Filter</button>
              <button className="btn btn-outline" onClick={resetFilters}>Reset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : transactions.length === 0 ? (
          <div className="empty-state"><p>No transactions found matching your filters</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Type</th><th>Amount</th><th>Description</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id} onClick={() => navigate(`/transactions/${t._id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.transactionId}</td>
                    <td><span className={`badge ${TYPE_BADGE[t.type] || 'badge-secondary'}`}>{t.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatPKR(t.amount)}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[t.status]}`}>
                        {t.suspiciousFlag && <FiAlertTriangle size={11} style={{ marginRight: 3 }} />}
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${pagination.current === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { const f = { ...filters, page: i + 1 }; setFilters(f); fetchTxns(f) }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
