import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, changePassword } from '../services/userService'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/formatDate'

export default function Profile() {
  const { user, login } = useAuth()
  const toast = useToast()
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNew: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await updateProfile(profileForm)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally { setProfileLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirmNew) { setPwError('Passwords do not match'); return }
    if (pwForm.newPassword.length < 6) { setPwError('New password must be 6+ characters'); return }
    setPwLoading(true)
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' })
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password')
    } finally { setPwLoading(false) }
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header"><h1>My Profile</h1></div>

      {/* Account info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h3>Account Information</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span className={`badge ${user?.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>{user?.role}</span>
                <span className={`badge ${user?.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{user?.status}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input className="form-control" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" value={user?.email} disabled style={{ background: 'var(--surface2)', cursor: 'not-allowed' }} />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Email cannot be changed</small>
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Member since {formatDate(user?.createdAt)}
            </div>
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header"><h3>Change Password</h3></div>
        <div className="card-body">
          {pwError && <div className="alert alert-error">{pwError}</div>}
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-control" type="password" value={pwForm.currentPassword} onChange={e => { setPwForm({ ...pwForm, currentPassword: e.target.value }); setPwError('') }} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" placeholder="Min 6 characters" value={pwForm.newPassword} onChange={e => { setPwForm({ ...pwForm, newPassword: e.target.value }); setPwError('') }} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-control" type="password" value={pwForm.confirmNew} onChange={e => { setPwForm({ ...pwForm, confirmNew: e.target.value }); setPwError('') }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
