import api from './api'

export const getExpenses = (params) => api.get('/expenses', { params }).then(r => r.data)
export const createExpense = (data) => api.post('/expenses', data).then(r => r.data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then(r => r.data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`).then(r => r.data)
export const getMonthlySummary = () => api.get('/expenses/summary/monthly').then(r => r.data)
export const getCategorySummary = () => api.get('/expenses/summary/categories').then(r => r.data)
