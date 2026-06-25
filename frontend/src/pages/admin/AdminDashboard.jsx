import { useState, useEffect } from 'react'
import { getAdminDashboard, getTransactionVolume } from '../../services/adminService'
import { formatPKR } from '../../utils/formatCurrency'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FiUsers, FiAlertTriangle, FiActivity, FiDollarSign } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [volumeData, setVolumeData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAdminDashboard(), getTransactionVolume()])
      .then(([s, v]) => {
        setStats(s.data)
        setVolumeData(v.data.volume.reverse())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: <FiUsers />, color: 'var(--primary)', bg: '#ede9fe' },
    { label: 'Active Users', value: stats?.activeUsers, icon: <FiActivity />, color: 'var(--secondary)', bg: '#d1fae5' },
    { label: 'Blocked Users', value: stats?.blockedUsers, icon: <FiAlertTriangle />, color: 'var(--danger)', bg: '#fee2e2' },
    { label: 'Total Transactions', value: stats?.totalTransactions, icon: <FiDollarSign />, color: 'var(--info)', bg: '#dbeafe' },
    { label: 'Flagged Transactions', value: stats?.flaggedTransactions, icon: <FiAlertTriangle />, color: 'var(--warning)', bg: '#fef3c7' },
    { label: 'System Balance', value: formatPKR(stats?.systemBalance), icon: <FiDollarSign />, color: '#7c3aed', bg: '#ede9fe' },
  ]

  return (
    <div className="page-wrapper">
      <div className="page-header"><h1>Admin Dashboard</h1></div>

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {cards.map(c => (
          <div key={c.label} className="stat-card" style={{ borderLeft: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: '6px', background: c.bg, color: c.color }}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><h3>Transaction Volume (Last 12 months)</h3></div>
        <div className="card-body">
          {volumeData.length === 0 ? (
            <div className="empty-state"><p>No transaction data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => formatPKR(v)} />
                <Bar dataKey="totalAmount" fill="#4f46e5" name="Volume" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
