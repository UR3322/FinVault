import { useState, useEffect } from 'react'
import { getWallet, depositFunds, withdrawFunds, transferFunds } from '../services/walletService'
import { formatPKR } from '../utils/formatCurrency'
import { useCountUp } from '../hooks/useCountUp'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiArrowDownLeft, FiArrowUpRight, FiRepeat } from 'react-icons/fi'
import './Wallet.css'

function ActionModal({ type, onClose, onSuccess }) {
  const [form, setForm] = useState({ amount: '', receiverEmail: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount'); return }
    if (type === 'transfer' && !form.receiverEmail) { setError('Receiver email is required'); return }
    setLoading(true)
    try {
      if (type === 'deposit') await depositFunds({ amount: form.amount, description: form.description })
      else if (type === 'withdrawal') await withdrawFunds({ amount: form.amount, description: form.description })
      else await transferFunds({ amount: form.amount, receiverEmail: form.receiverEmail, description: form.description })
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} successful!`)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">
          {type === 'deposit' ? '+ Deposit Funds' : type === 'withdrawal' ? '- Withdraw Funds' : '→ Transfer Funds'}
        </h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount (PKR)</label>
            <input className="form-control" type="number" min="1" placeholder="0" value={form.amount} onChange={e => { setForm({ ...form, amount: e.target.value }); setError('') }} />
          </div>
          {type === 'transfer' && (
            <div className="form-group">
              <label className="form-label">Receiver Email</label>
              <input className="form-control" type="email" placeholder="receiver@example.com" value={form.receiverEmail} onChange={e => { setForm({ ...form, receiverEmail: e.target.value }); setError('') }} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input className="form-control" type="text" placeholder="What's this for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <><div className="spinner" /> Processing...</> : `Confirm ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const toast = useToast()

  const fetchWallet = () => {
    setLoading(true)
    getWallet()
      .then(res => setWallet(res.data.wallet))
      .catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchWallet() }, [])

  const animatedBalance = useCountUp(wallet?.balance || 0, 1000)

  if (loading) return <LoadingSpinner />

  const handleSuccess = () => { setModal(null); fetchWallet() }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>My Wallet</h1>
      </div>

      {/* Balance card */}
      <div className="wallet-balance-card">
        <div className="wallet-balance-label">Available Balance</div>
        <div className="wallet-balance-amount">PKR {animatedBalance.toLocaleString()}</div>
        <div className="wallet-currency">{wallet?.currency || 'PKR'} • {wallet?.status}</div>

        {wallet?.balance < 1000 && (
          <div className="wallet-low-balance">⚠ Low balance warning</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="wallet-actions">
        <button className="wallet-action-btn deposit" onClick={() => setModal('deposit')}>
          <FiArrowDownLeft size={22} />
          <span>Deposit</span>
        </button>
        <button className="wallet-action-btn withdraw" onClick={() => setModal('withdrawal')} disabled={wallet?.balance <= 0}>
          <FiArrowUpRight size={22} />
          <span>Withdraw</span>
        </button>
        <button className="wallet-action-btn transfer" onClick={() => setModal('transfer')} disabled={wallet?.balance <= 0}>
          <FiRepeat size={22} />
          <span>Transfer</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3>Wallet Summary</h3></div>
          <div className="card-body">
            <div className="wallet-summary-row">
              <span>Total Deposited</span>
              <strong style={{ color: 'var(--secondary)' }}>{formatPKR(wallet?.totalDeposits)}</strong>
            </div>
            <div className="wallet-summary-row">
              <span>Total Withdrawn</span>
              <strong style={{ color: 'var(--danger)' }}>{formatPKR(wallet?.totalWithdrawals)}</strong>
            </div>
            <div className="wallet-summary-row">
              <span>Transfers In</span>
              <strong style={{ color: 'var(--secondary)' }}>{formatPKR(wallet?.totalTransfersIn)}</strong>
            </div>
            <div className="wallet-summary-row">
              <span>Transfers Out</span>
              <strong style={{ color: 'var(--danger)' }}>{formatPKR(wallet?.totalTransfersOut)}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Wallet Info</h3></div>
          <div className="card-body">
            <div className="wallet-summary-row"><span>Currency</span><strong>{wallet?.currency}</strong></div>
            <div className="wallet-summary-row"><span>Status</span>
              <span className={`badge ${wallet?.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{wallet?.status}</span>
            </div>
            <div className="wallet-summary-row"><span>Created</span><strong style={{ fontSize: '0.8rem' }}>{new Date(wallet?.createdAt).toLocaleDateString()}</strong></div>
          </div>
        </div>
      </div>

      {modal && <ActionModal type={modal} onClose={() => setModal(null)} onSuccess={handleSuccess} />}
    </div>
  )
}
