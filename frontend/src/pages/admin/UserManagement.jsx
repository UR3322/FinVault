import { useState, useEffect } from 'react'
import { getAllUsers, blockUser, unblockUser } from '../../services/adminService'
import { formatDate } from '../../utils/formatDate'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { FiSearch, FiLock, FiUnlock } from 'react-icons/fi'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const toast = useToast()

  const fetch = (s = search, sf = statusFilter) => {
    setLoading(true)
    const params = {}
    if (s)  params.search = s
    if (sf) params.status = sf
    getAllUsers(params)
      .then(res => setUsers(res.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleBlock = async (id, isBlocked) => {
    if (!window.confirm(isBlocked ? 'Unblock this user?' : 'Block this user?')) return
    setActionLoading(id)
    try {
      if (isBlocked) await unblockUser(id)
      else await blockUser(id)
      toast.success(isBlocked ? 'User unblocked' : 'User blocked')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header"><h1>User Management</h1></div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
            <FiSearch style={{ color: 'var(--text-muted)' }} />
            <input className="form-control" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetch()} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); fetch(search, e.target.value) }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <button className="btn btn-primary" onClick={() => fetch()}>Search</button>
        </div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : users.length === 0 ? (
          <div className="empty-state"><p>No users found</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(u.createdAt)}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn btn-sm ${u.status === 'blocked' ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => handleBlock(u._id, u.status === 'blocked')}
                          disabled={actionLoading === u._id}
                        >
                          {actionLoading === u._id ? '...' : u.status === 'blocked' ? <><FiUnlock /> Unblock</> : <><FiLock /> Block</>}
                        </button>
                      )}
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
