import { useState, useEffect } from 'react'
import {
  getAdminDashboard,
  getTransactionVolume,
  getFlaggedTransactions,
  getAllWallets,
  getSystemBalance
} from '../../services/adminService'
import { formatPKR } from '../../utils/formatCurrency'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

// counts how many times each suspicious reason appears across all flagged txns
function buildReasonData(flaggedList) {
  const counts = {}
  flaggedList.forEach(tx => {
    if (!tx.suspiciousReasons) return
    tx.suspiciousReasons.forEach(r => {
      counts[r] = (counts[r] || 0) + 1
    })
  })
  return Object.entries(counts)
    .map(([reason, count]) => ({ reason: reason.length > 35 ? reason.slice(0, 35) + '...' : reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

export default function AdminReports() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [volumeData, setVolumeData] = useState([])
  const [reasonData, setReasonData] = useState([])
  const [topWallets, setTopWallets] = useState([])
  const [sysBalance, setSysBalance] = useState(null)

  useEffect(() => {
    Promise.all([
      getAdminDashboard(),
      getTransactionVolume(),
      getFlaggedTransactions(),
      getAllWallets(),
      getSystemBalance()
    ])
      .then(([dash, vol, flagged, wallets, balance]) => {
        setStats(dash.data)
        setVolumeData(vol.data.volume.slice().reverse())
        setReasonData(buildReasonData(flagged.data.transactions || []))

        const sorted = [...(wallets.data.wallets || [])].sort((a, b) => b.balance - a.balance)
        setTopWallets(sorted.slice(0, 5))
        setSysBalance(balance.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  // data for user status pie
  const userPieData = [
    { name: 'Active', value: stats?.activeUsers || 0 },
    { name: 'Blocked', value: stats?.blockedUsers || 0 },
  ]

  // transaction status breakdown
  const txPieData = [
    { name: 'Total', value: stats?.totalTransactions || 0 },
    { name: 'Flagged', value: stats?.flaggedTransactions || 0 },
  ]

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>System Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Platform-wide analytics and monitoring overview
          </p>
        </div>
      </div>

      {/* summary cards at top */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats?.totalUsers ?? 0}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {stats?.activeUsers} active · {stats?.blockedUsers} blocked
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--secondary)' }}>
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>{stats?.totalTransactions ?? 0}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {stats?.flaggedTransactions} flagged
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #7c3aed' }}>
          <div className="stat-label">System Balance</div>
          <div className="stat-value" style={{ color: '#7c3aed', fontSize: '1.3rem' }}>
            {formatPKR(sysBalance?.totalBalance || 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            across {sysBalance?.walletCount || 0} wallets
          </div>
        </div>
      </div>

      {/* transaction volume chart */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>Monthly Transaction Volume</h3>
        </div>
        <div className="card-body">
          {volumeData.length === 0 ? (
            <div className="empty-state"><p>No transaction data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={volumeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(val) => [formatPKR(val), 'Volume']}
                  contentStyle={{ fontSize: '0.8rem', borderRadius: '8px' }}
                />
                <Bar dataKey="totalAmount" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* two pies side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3>User Status</h3></div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
            {userPieData.every(d => d.value === 0) ? (
              <div className="empty-state"><p>No user data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={userPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {userPieData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Tooltip formatter={v => [v, 'Users']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Transaction Health</h3></div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
            {txPieData.every(d => d.value === 0) ? (
              <div className="empty-state"><p>No transaction data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={txPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Tooltip formatter={v => [v, 'Transactions']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* suspicious reasons breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>Suspicious Rule Triggers</h3>
        </div>
        <div className="card-body">
          {reasonData.length === 0 ? (
            <div className="empty-state"><p>No flagged transactions found</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reasonData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="reason" tick={{ fontSize: 10 }} width={200} />
                <Tooltip contentStyle={{ fontSize: '0.8rem', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} name="Triggers" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* top wallets by balance */}
      <div className="card">
        <div className="card-header">
          <h3>Top Wallets by Balance</h3>
        </div>
        {topWallets.length === 0 ? (
          <div className="empty-state"><p>No wallets found</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Balance</th>
                  <th>Total Deposited</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topWallets.map((w, idx) => (
                  <tr key={w._id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{w.userId?.name || '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{w.userId?.email || '-'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>{formatPKR(w.balance)}</td>
                    <td>{formatPKR(w.totalDeposits)}</td>
                    <td>
                      <span className={`badge ${w.userId?.status === 'blocked' ? 'badge-danger' : 'badge-success'}`}>
                        {w.userId?.status || 'active'}
                      </span>
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
