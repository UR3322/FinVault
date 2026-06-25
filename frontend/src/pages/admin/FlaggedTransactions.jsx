import { useState, useEffect } from 'react'
import { getFlaggedTransactions } from '../../services/adminService'
import { formatPKR } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FiAlertTriangle } from 'react-icons/fi'

export default function FlaggedTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getFlaggedTransactions()
      .then(res => setTransactions(res.data.transactions))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Flagged Transactions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{transactions.length} suspicious transaction{transactions.length !== 1 ? 's' : ''} detected</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : transactions.length === 0 ? (
        <div className="empty-state card" style={{ padding: '3rem' }}>
          <FiAlertTriangle size={40} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <p>No flagged transactions found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Transaction ID</th><th>Type</th><th>Amount</th><th>From</th><th>Reasons</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t._id} onClick={() => setSelected(selected?._id === t._id ? null : t)} style={{ cursor: 'pointer', background: selected?._id === t._id ? '#fef3c7' : undefined }}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{t.transactionId}</td>
                      <td><span className="badge badge-secondary">{t.type}</span></td>
                      <td style={{ fontWeight: 600 }}>{formatPKR(t.amount)}</td>
                      <td style={{ fontSize: '0.85rem' }}>{t.senderId?.email || '-'}</td>
                      <td>
                        <span className="badge badge-warning">
                          <FiAlertTriangle size={11} /> {t.suspiciousReasons?.length} rule{t.suspiciousReasons?.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="card" style={{ width: 320, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: '80px' }}>
              <div className="card-header">
                <h3>Suspicious Reasons</h3>
                <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transaction ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '0.2rem' }}>{selected.transactionId}</div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount</div>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--danger)' }}>{formatPKR(selected.amount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Triggered Rules</div>
                  {selected.suspiciousReasons?.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.625rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.8rem', color: '#92400e' }}>
                      <FiAlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
