const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER: 'transfer',
  REFUND: 'refund',
  FEE: 'fee'
};

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  FLAGGED: 'flagged'
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

const BUDGET_STATUS = {
  SAFE: 'safe',
  NEAR_LIMIT: 'nearLimit',
  EXCEEDED: 'exceeded'
};

const NOTIFICATION_TYPES = {
  TRANSACTION: 'transaction',
  BUDGET: 'budget',
  SECURITY: 'security',
  ACCOUNT: 'account',
  SYSTEM: 'system'
};

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense' },
  { name: 'Transportation', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Bills & Utilities', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Healthcare', type: 'expense' },
  { name: 'Education', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Other', type: 'expense' }
];

module.exports = {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  USER_ROLES,
  BUDGET_STATUS,
  NOTIFICATION_TYPES,
  DEFAULT_CATEGORIES
};
