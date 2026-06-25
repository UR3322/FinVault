import api from './api';

export const getTransactions = async (params = {}) => {
  const res = await api.get('/transactions', { params });
  return res.data;
};

export const getTransactionById = async (id) => {
  const res = await api.get(`/transactions/${id}`);
  return res.data;
};

export const getTransactionReceipt = async (id) => {
  const res = await api.get(`/transactions/${id}/receipt`);
  return res.data;
};

export const getMonthlySummary = async () => {
  const res = await api.get('/transactions/summary/monthly');
  return res.data;
};
