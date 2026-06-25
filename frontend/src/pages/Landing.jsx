import { useNavigate } from 'react-router-dom'
import { FiShield, FiTrendingUp, FiCreditCard, FiPieChart } from 'react-icons/fi'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="brand-icon-lg">₿</span>
          <span>FinVault</span>
        </div>
        <div className="landing-nav-links">
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">Secure Demo Wallet Platform</span>
          <h1>Manage Your Finances<br /><span className="gradient-text">Smarter & Safer</span></h1>
          <p>FinVault gives you a powerful digital wallet experience with real-time expense tracking, budget management, and intelligent fraud detection.</p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
              Create Free Account
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-label">Current Balance</div>
            <div className="hero-card-balance">PKR 45,230</div>
            <div className="hero-card-row">
              <div>
                <div className="hero-card-sub">Total Deposited</div>
                <div className="hero-card-val">PKR 60,000</div>
              </div>
              <div>
                <div className="hero-card-sub">Spent</div>
                <div className="hero-card-val">PKR 14,770</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          {[
            { icon: <FiCreditCard size={28} />, title: 'Digital Wallet', desc: 'Deposit, withdraw, and transfer funds securely with backend-validated transactions.' },
            { icon: <FiPieChart size={28} />, title: 'Expense Tracking', desc: 'Log and categorise expenses. Get monthly summaries and spending insights.' },
            { icon: <FiTrendingUp size={28} />, title: 'Budget Management', desc: 'Set monthly budgets per category and get alerts when limits are approaching.' },
            { icon: <FiShield size={28} />, title: 'Fraud Detection', desc: 'Seven intelligent rules monitor transactions for suspicious patterns in real time.' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 FinVault. Built with MERN Stack.</p>
      </footer>
    </div>
  )
}
