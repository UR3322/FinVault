import { useState, useEffect } from 'react'
import { getIncomeExpense, getBudgetUsage } from '../services/reportService'
import { getCategorySummary } from '../services/expenseService'
import { formatPKR } from '../utils/formatCurrency'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export default function Reports() {
  const [incomeData, setIncomeData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [budgetData, setBudgetData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getIncomeExpense(6), getCategorySummary(), getBudgetUsage()])
      .then(([ie, cat, bud]) => {
        // merge income and outgoing
        const incomeMap = {}
        ie.data.income.forEach(i => incomeMap[i._id] = { month: i._id, income: i.total, expense: 0 })
        ie.data.outgoing.forEach(o => {
          if (incomeMap[o._id]) incomeMap[o._id].expense = o.total
          else incomeMap[o._id] = { month: o._id, income: 0, expense: o.total }
        })
        setIncomeData(Object.values(incomeMap).sort((a, b) => a.month.localeCompare(b.month)))
        setCategoryData(cat.data.summary.slice(0, 8))
        setBudgetData(bud.data.usage.reverse())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="page-wrapper">
      <div className="page-header"><h1>Reports & Analytics</h1></div>

      {/* Income vs Expense */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h3>Income vs Expense (Last 6 months)</h3></div>
        <div className="card-body">
          {incomeData.length === 0 ? (
            <div className="empty-state"><p>No transaction data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => formatPKR(v)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Spending by category */}
        <div className="card">
          <div className="card-header"><h3>Spending by Category</h3></div>
          <div className="card-body">
            {categoryData.length === 0 ? (
              <div className="empty-state"><p>No expense data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={90} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatPKR(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Budget usage */}
        <div className="card">
          <div className="card-header"><h3>Budget Usage History</h3></div>
          <div className="card-body">
            {budgetData.length === 0 ? (
              <div className="empty-state"><p>No budget data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Line type="monotone" dataKey="percentage" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} name="Usage %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Category table */}
      {categoryData.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Category Breakdown</h3></div>
          <div className="table-container">
            <table>
              <thead><tr><th>Category</th><th>Total Spent</th><th>Transactions</th></tr></thead>
              <tbody>
                {categoryData.map((c, i) => (
                  <tr key={c._id}>
                    <td>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 8 }} />
                      {c._id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatPKR(c.total)}</td>
                    <td>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
