import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTransactionReceipt } from '../services/transactionService'
import { formatPKR } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi'

const STATUS_BADGE = { successful: 'badge-success', failed: 'badge-danger', flagged: 'badge-warning', pending: 'badge-secondary' }

export default function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTransactionReceipt(id)
      .then(res => setReceipt(res.data.receipt))
      .catch(err => setError(err.response?.data?.message || 'Transaction not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />

  return (
    <div className="page-wrapper" style={{ maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.25rem' }}>
        <FiArrowLeft /> Back
      </button>

      {error ? <div className="alert alert-error">{error}</div> : (
        <div className="card">
          <div className="card-header">
            <h2>Transaction Receipt</h2>
            {receipt?.suspiciousFlag && (
              <span className="badge badge-warning"><FiAlertTriangle /> Flagged</span>
            )}
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                {formatPKR(receipt?.amount)}
              </div>
              <span className={`badge ${STATUS_BADGE[receipt?.status]}`}>{receipt?.status}</span>
            </div>

            {[
              ['Transaction ID', receipt?.transactionId],
              ['Type', receipt?.type],
              ['Category', receipt?.category],
              ['Description', receipt?.description || '-'],
              ['Date', formatDateTime(receipt?.date)],
              receipt?.sender ? ['From', `${receipt.sender.name} (${receipt.sender.email})`] : null,
              receipt?.receiver ? ['To', `${receipt.receiver.name} (${receipt.receiver.email})`] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <strong style={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
