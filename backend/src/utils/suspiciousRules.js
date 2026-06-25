const Transaction = require('../models/Transaction');

// Rule 1 - single transaction above 100k PKR
function checkLargeTransaction(amount) {
  if (amount > 100000) {
    return { flagged: true, reason: 'Transaction amount exceeds 100,000 PKR threshold' };
  }
  return { flagged: false };
}

// Rule 2 - more than 5 transactions in 10 minutes
async function checkRapidTransactions(userId) {
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const count = await Transaction.countDocuments({
    $or: [{ senderId: userId }, { receiverId: userId }],
    createdAt: { $gte: tenMinsAgo },
    status: { $in: ['successful', 'pending'] }
  });

  if (count >= 5) {
    return { flagged: true, reason: `Rapid transactions detected: ${count + 1} transactions within 10 minutes` };
  }
  return { flagged: false };
}

// Rule 3 - more than 3 failed withdrawals in one day
async function checkRepeatedFailures(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const failedCount = await Transaction.countDocuments({
    senderId: userId,
    type: 'withdrawal',
    status: 'failed',
    createdAt: { $gte: startOfDay }
  });

  if (failedCount >= 3) {
    return { flagged: true, reason: `${failedCount} failed withdrawal attempts today` };
  }
  return { flagged: false };
}

// Rule 4 - same amount transferred more than 3 times in a day
async function checkRepeatedSameAmount(userId, amount) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sameAmountCount = await Transaction.countDocuments({
    senderId: userId,
    amount: amount,
    type: 'transfer',
    createdAt: { $gte: startOfDay }
  });

  if (sameAmountCount >= 3) {
    return { flagged: true, reason: `Same amount (${amount} PKR) transferred ${sameAmountCount} times today` };
  }
  return { flagged: false };
}

// Rule 5 - new account (less than 7 days) making large transaction
function checkNewAccountLargeTransaction(userCreatedAt, amount) {
  const daysSinceCreation = (Date.now() - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 7 && amount > 25000) {
    return { flagged: true, reason: `New account (${Math.floor(daysSinceCreation)} days old) making large transaction of ${amount} PKR` };
  }
  return { flagged: false };
}

// Rule 6 - transaction during unusual hours (1AM - 5AM)
function checkUnusualHours() {
  const hour = new Date().getHours();
  if (hour >= 1 && hour < 5) {
    return { flagged: true, reason: `Transaction during unusual hours (${hour}:00)` };
  }
  return { flagged: false };
}

// Rule 7 - withdrawing more than 90% of balance
function checkNearBalanceWithdrawal(amount, currentBalance) {
  if (currentBalance > 0 && amount >= currentBalance * 0.9) {
    return { flagged: true, reason: 'Withdrawal of 90% or more of total balance' };
  }
  return { flagged: false };
}

async function evaluateAllRules(userId, amount, type, userCreatedAt, currentBalance) {
  const reasons = [];

  // always check
  const r1 = checkLargeTransaction(amount);
  if (r1.flagged) reasons.push(r1.reason);

  const r2 = await checkRapidTransactions(userId);
  if (r2.flagged) reasons.push(r2.reason);

  const r6 = checkUnusualHours();
  if (r6.flagged) reasons.push(r6.reason);

  const r5 = checkNewAccountLargeTransaction(userCreatedAt, amount);
  if (r5.flagged) reasons.push(r5.reason);

  // type-specific checks
  if (type === 'withdrawal') {
    const r3 = await checkRepeatedFailures(userId);
    if (r3.flagged) reasons.push(r3.reason);

    const r7 = checkNearBalanceWithdrawal(amount, currentBalance);
    if (r7.flagged) reasons.push(r7.reason);
  }

  if (type === 'transfer') {
    const r4 = await checkRepeatedSameAmount(userId, amount);
    if (r4.flagged) reasons.push(r4.reason);
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons
  };
}

module.exports = { evaluateAllRules };
