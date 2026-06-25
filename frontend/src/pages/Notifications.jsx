import { useState, useEffect } from 'react'
import { getNotifications, markAsRead, markAllRead } from '../services/notificationService'
import { formatDateTime } from '../utils/formatDate'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiBell, FiCheckCircle } from 'react-icons/fi'

const TYPE_COLORS = { transaction: 'var(--info)', budget: 'var(--warning)', security: 'var(--danger)', account: 'var(--primary)', system: 'var(--text-muted)' }

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const fetch = () => {
    setLoading(true)
    getNotifications()
      .then(res => { setNotifications(res.data.notifications); setUnreadCount(res.data.unreadCount) })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleMarkRead = async (id) => {
    try { await markAsRead(id); fetch() } catch {}
  }

  const handleMarkAll = async () => {
    try { await markAllRead(); toast.success('All marked as read'); fetch() } catch {}
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          {unreadCount > 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline" onClick={handleMarkAll}><FiCheckCircle /> Mark all read</button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
        <div className="empty-state card" style={{ padding: '3rem' }}>
          <FiBell size={40} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(n => (
            <div
              key={n._id}
              className="card"
              style={{ opacity: n.readStatus ? 0.7 : 1, borderLeft: `3px solid ${TYPE_COLORS[n.type] || 'var(--border)'}`, cursor: n.readStatus ? 'default' : 'pointer' }}
              onClick={() => !n.readStatus && handleMarkRead(n._id)}
            >
              <div className="card-body" style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      {!n.readStatus && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />}
                      <strong style={{ fontSize: '0.9rem' }}>{n.title}</strong>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{n.message}</p>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(n.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
