import { useState, useEffect } from 'react'
import { getAllTransactions } from '../../services/adminService'
import { formatPKR } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FiAlertTriangle, FiFilter } from 'react-icons/fi'

const STATUS_BADGE = { successful: 'badge-success', failed: 'badge-danger', flagged: 'badge-warning', pending: 'badge-secondary' }

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', status: '', page: 1 })

  const fetch = (f = filters) => {
    setLoading(true)
    const params = { page: f.page }
    if (f.type)   params.type = f.type
    if (f.status) params.status = f.status
    getAllTransactions(params)
      .then(res => { setTransactions(res.data.transactions); setPagination(res.data.pagination) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  return (
    <div className="page-wrapper">
      <div className="page-header"><h1>All Transactions</h1></div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select className="form-control" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-control" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => { const f = { ...filters, page: 1 }; setFilters(f); fetch(f) }}><FiFilter size={14} /> Filter</button>
        </div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Type</th><th>Amount</th><th>From</th><th>To</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.transactionId}</td>
                    <td><span className="badge badge-secondary">{t.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatPKR(t.amount)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{t.senderId?.email || '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{t.receiverId?.email || '-'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[t.status]}`}>
                        {t.suspiciousFlag && <FiAlertTriangle size={10} />} {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
            {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => (
              <button key={i} className={`btn btn-sm ${pagination.current === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { const f = { ...filters, page: i + 1 }; setFilters(f); fetch(f) }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
