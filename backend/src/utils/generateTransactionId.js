const generateTransactionId = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `TXN-${date}-${random}`;
};

module.exports = generateTransactionId;
