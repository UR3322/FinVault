import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications } from '../services/notificationService'
import { FiBell } from 'react-icons/fi'

export default function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    getNotifications()
      .then(res => setUnread(res.data.unreadCount || 0))
      .catch(() => {})

    const interval = setInterval(() => {
      getNotifications()
        .then(res => setUnread(res.data.unreadCount || 0))
        .catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <button
      onClick={() => navigate('/notifications')}
      style={{ position: 'relative', background: 'none', border: 'none', padding: '0.5rem', color: 'inherit', cursor: 'pointer' }}
    >
      <FiBell size={20} />
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          background: '#ef4444', color: '#fff',
          borderRadius: '50%', width: 16, height: 16,
          fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700
        }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
