import api from './api'

export const getUserDashboard = () => api.get('/reports/user-dashboard').then(r => r.data)
export const getIncomeExpense = (months = 6) => api.get('/reports/income-expense', { params: { months } }).then(r => r.data)
export const getBudgetUsage = () => api.get('/reports/budget-usage').then(r => r.data)
