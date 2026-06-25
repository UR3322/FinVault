import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserDashboard } from '../services/reportService'
import { formatPKR } from '../utils/formatCurrency'
import { formatDateTime } from '../utils/formatDate'
import { useCountUp } from '../hooks/useCountUp'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiArrowUpRight, FiArrowDownLeft, FiRepeat, FiAlertTriangle } from 'react-icons/fi'
import './Dashboard.css'

const TXN_ICONS = {
  deposit: <FiArrowDownLeft size={15} />,
  withdrawal: <FiArrowUpRight size={15} />,
  transfer: <FiRepeat size={15} />,
}
const TXN_COLORS = { deposit: 'badge-success', withdrawal: 'badge-danger', transfer: 'badge-info' }

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserDashboard()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const animatedBalance = useCountUp(data?.balance || 0, 1200)

  if (loading) return <LoadingSpinner />

  const budget = data?.budget

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Here's your financial overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/wallet')}>
          Go to Wallet
        </button>
      </div>

      {/* Balance + quick stats */}
      <div className="dashboard-hero card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Wallet Balance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>
              PKR {animatedBalance.toLocaleString()}
            </div>
          </div>
          <div className="dash-stats-row">
            {data?.transactionBreakdown?.map(t => (
              <div key={t._id} className="dash-stat-chip">
                <span className="dash-stat-label">{t._id}</span>
                <span className="dash-stat-val">{formatPKR(t.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">This Month Spent</div>
          <div className="stat-value">{formatPKR(data?.monthlyExpenses?.total || 0)}</div>
          <div className="stat-sub">{data?.monthlyExpenses?.count || 0} expenses</div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/budgets')}>
          <div className="stat-label">Budget Status</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {budget ? (
              <span className={`badge ${budget.status === 'safe' ? 'badge-success' : budget.status === 'nearLimit' ? 'badge-warning' : 'badge-danger'}`}>
                {budget.status === 'safe' ? 'On Track' : budget.status === 'nearLimit' ? 'Near Limit' : 'Exceeded'}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No budget set</span>
            )}
          </div>
          {budget && (
            <div className="stat-sub">{formatPKR(budget.spentAmount)} / {formatPKR(budget.totalLimit)}</div>
          )}
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/transactions')}>
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">
            {data?.transactionBreakdown?.reduce((a, b) => a + b.count, 0) || 0}
          </div>
          <div className="stat-sub">View all →</div>
        </div>
      </div>

      {/* Budget progress */}
      {budget && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Budget Progress — {budget.month}</h3>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/budgets')}>Manage</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span>{formatPKR(budget.spentAmount)} spent</span>
              <span style={{ color: 'var(--text-muted)' }}>of {formatPKR(budget.totalLimit)}</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${budget.status}`}
                style={{ width: `${Math.min(100, (budget.spentAmount / budget.totalLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Transactions</h3>
          <button className="btn btn-sm btn-outline" onClick={() => navigate('/transactions')}>View All</button>
        </div>
        {data?.recentTransactions?.length === 0 ? (
          <div className="empty-state"><p>No transactions yet. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/wallet')}>Make your first deposit</span></p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.map(t => (
                  <tr key={t._id} onClick={() => navigate(`/transactions/${t._id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className={`badge ${TXN_COLORS[t.type] || 'badge-secondary'}`}>
                        {TXN_ICONS[t.type]} {t.type}
                      </span>
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ fontWeight: 600 }}>{formatPKR(t.amount)}</td>
                    <td>
                      <span className={`badge ${t.status === 'successful' ? 'badge-success' : t.status === 'flagged' ? 'badge-warning' : t.status === 'failed' ? 'badge-danger' : 'badge-secondary'}`}>
                        {t.suspiciousFlag && <FiAlertTriangle size={11} />} {t.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(t.createdAt)}</td>
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
