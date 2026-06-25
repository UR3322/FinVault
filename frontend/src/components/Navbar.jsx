import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import NotificationBell from './NotificationBell'
import { FiLogOut, FiUser, FiShield } from 'react-icons/fi'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')}>
        <span className="brand-icon">₿</span>
        <span className="brand-name">FinVault</span>
      </div>

      <div className="navbar-links">
        {user.role === 'admin' ? (
          <>
            <NavLink to="/admin/dashboard">Dashboard</NavLink>
            <NavLink to="/admin/users">Users</NavLink>
            <NavLink to="/admin/wallets">Wallets</NavLink>
            <NavLink to="/admin/transactions">Transactions</NavLink>
            <NavLink to="/admin/flagged">Flagged</NavLink>
            <NavLink to="/admin/categories">Categories</NavLink>
            <NavLink to="/admin/reports">Reports</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/wallet">Wallet</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/expenses">Expenses</NavLink>
            <NavLink to="/budgets">Budgets</NavLink>
            <NavLink to="/reports">Reports</NavLink>
          </>
        )}
      </div>

      <div className="navbar-right">
        <NotificationBell />
        <NavLink to={user.role === 'admin' ? '/admin/profile' : '/profile'} className="nav-user-btn">
          <FiUser size={16} />
          <span>{user.name.split(' ')[0]}</span>
          {user.role === 'admin' && <FiShield size={13} style={{ color: '#f59e0b' }} />}
        </NavLink>
        <button className="nav-logout-btn" onClick={handleLogout} title="Logout">
          <FiLogOut size={17} />
        </button>
      </div>
    </nav>
  )
}
