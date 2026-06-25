import api from './api';

export const getWallet = async () => {
  const res = await api.get('/wallet');
  return res.data;
};

export const getWalletSummary = async () => {
  const res = await api.get('/wallet/summary');
  return res.data;
};

export const depositFunds = async (data) => {
  const res = await api.post('/wallet/deposit', data);
  return res.data;
};

export const withdrawFunds = async (data) => {
  const res = await api.post('/wallet/withdraw', data);
  return res.data;
};

export const transferFunds = async (data) => {
  const res = await api.post('/wallet/transfer', data);
  return res.data;
};
