import { useState, useEffect } from 'react'
import { getAllWallets } from '../../services/adminService'
import { formatPKR } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminWallets() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllWallets()
      .then(res => setWallets(res.data.wallets))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0)

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>All Wallets</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>System Total: {formatPKR(totalBalance)}</p>
        </div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : wallets.length === 0 ? (
          <div className="empty-state"><p>No wallets found</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Balance</th><th>Total Deposits</th><th>Total Withdrawals</th><th>Status</th><th>Created</th></tr>
              </thead>
              <tbody>
                {wallets.map(w => (
                  <tr key={w._id}>
                    <td style={{ fontWeight: 500 }}>{w.userId?.name || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{w.userId?.email || '-'}</td>
                    <td style={{ fontWeight: 700, color: w.balance > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>{formatPKR(w.balance)}</td>
                    <td>{formatPKR(w.totalDeposits)}</td>
                    <td>{formatPKR(w.totalWithdrawals)}</td>
                    <td>
                      <span className={`badge ${w.userId?.status === 'blocked' ? 'badge-danger' : 'badge-success'}`}>
                        {w.userId?.status || 'active'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(w.createdAt)}</td>
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
