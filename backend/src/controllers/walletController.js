const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const generateTransactionId = require('../utils/generateTransactionId');
const { evaluateAllRules } = require('../utils/suspiciousRules');
const createNotification = require('../utils/createNotification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Money is stored with 2-decimal precision to avoid float drift
const normalizeAmount = (amount) => Math.round(parseFloat(amount) * 100) / 100;

// Transaction IDs are unique-indexed; retry on the (rare) collision
// instead of surfacing a 500 to the user.
const createTransaction = async (doc, retries = 5) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await Transaction.create({
        ...doc,
        transactionId: generateTransactionId()
      });
    } catch (err) {
      if (err.code === 11000 && attempt < retries - 1) continue;
      throw err;
    }
  }
};

// All balance changes below use single atomic findOneAndUpdate calls
// ($inc + a balance guard), so concurrent requests can never
// overdraw a wallet or lose money mid-transfer.

// GET /api/wallet
const getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return sendError(res, 'Wallet not found', 404);
    }
    sendSuccess(res, { wallet });
  } catch (err) {
    next(err);
  }
};

// GET /api/wallet/summary
const getWalletSummary = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return sendError(res, 'Wallet not found', 404);

    const summary = {
      balance: wallet.balance,
      currency: wallet.currency,
      totalDeposits: wallet.totalDeposits,
      totalWithdrawals: wallet.totalWithdrawals,
      totalTransfersIn: wallet.totalTransfersIn,
      totalTransfersOut: wallet.totalTransfersOut,
      netFlow: (wallet.totalDeposits + wallet.totalTransfersIn) - (wallet.totalWithdrawals + wallet.totalTransfersOut)
    };

    sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/deposit
const deposit = async (req, res, next) => {
  try {
    const { description, category } = req.body;
    const numAmount = normalizeAmount(req.body.amount);

    // check suspicious rules against the pre-deposit balance
    const currentWallet = await Wallet.findOne({ userId: req.user._id });
    if (!currentWallet) return sendError(res, 'Wallet not found', 404);

    const suspiciousResult = await evaluateAllRules(
      req.user._id, numAmount, 'deposit', req.user.createdAt, currentWallet.balance
    );

    const balanceBefore = currentWallet.balance;

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { balance: numAmount, totalDeposits: numAmount } },
      { new: true }
    );

    const txn = await createTransaction({
      senderId: null,
      receiverId: req.user._id,
      amount: numAmount,
      type: 'deposit',
      status: suspiciousResult.isSuspicious ? 'flagged' : 'successful',
      category: category || 'Deposit',
      description: description || 'Wallet deposit',
      balanceBefore,
      balanceAfter: wallet.balance,
      suspiciousFlag: suspiciousResult.isSuspicious,
      suspiciousReasons: suspiciousResult.reasons
    });

    await createNotification(
      req.user._id,
      'Deposit Successful',
      `${numAmount.toLocaleString()} PKR deposited to your wallet`,
      'transaction',
      txn.transactionId
    );

    if (suspiciousResult.isSuspicious) {
      await createNotification(
        req.user._id,
        'Transaction Under Review',
        `Your deposit of ${numAmount.toLocaleString()} PKR has been flagged for review`,
        'security',
        txn.transactionId
      );
    }

    sendSuccess(res, { transaction: txn, newBalance: wallet.balance }, 'Deposit successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/withdraw
const withdraw = async (req, res, next) => {
  try {
    const { description, category } = req.body;
    const numAmount = normalizeAmount(req.body.amount);

    const existingWallet = await Wallet.findOne({ userId: req.user._id });
    if (!existingWallet) return sendError(res, 'Wallet not found', 404);

    const suspiciousResult = await evaluateAllRules(
      req.user._id, numAmount, 'withdrawal', req.user.createdAt, existingWallet.balance
    );

    const balanceBefore = existingWallet.balance;

    // Atomic debit: only succeeds if the balance covers the amount,
    // so two simultaneous withdrawals can't both pass the check.
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, balance: { $gte: numAmount } },
      { $inc: { balance: -numAmount, totalWithdrawals: numAmount } },
      { new: true }
    );

    if (!wallet) {
      // record failed transaction
      await createTransaction({
        senderId: req.user._id,
        amount: numAmount,
        type: 'withdrawal',
        status: 'failed',
        description: 'Insufficient balance',
        balanceBefore,
        balanceAfter: balanceBefore
      });
      return sendError(res, 'Insufficient balance', 400);
    }

    const txn = await createTransaction({
      senderId: req.user._id,
      amount: numAmount,
      type: 'withdrawal',
      status: suspiciousResult.isSuspicious ? 'flagged' : 'successful',
      category: category || 'Withdrawal',
      description: description || 'Wallet withdrawal',
      balanceBefore,
      balanceAfter: wallet.balance,
      suspiciousFlag: suspiciousResult.isSuspicious,
      suspiciousReasons: suspiciousResult.reasons
    });

    await createNotification(
      req.user._id,
      'Withdrawal Successful',
      `${numAmount.toLocaleString()} PKR withdrawn from your wallet`,
      'transaction',
      txn.transactionId
    );

    // low balance warning
    if (wallet.balance < 1000) {
      await createNotification(
        req.user._id,
        'Low Balance Warning',
        `Your wallet balance is low: ${wallet.balance.toLocaleString()} PKR`,
        'account'
      );
    }

    sendSuccess(res, { transaction: txn, newBalance: wallet.balance }, 'Withdrawal successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/transfer
const transfer = async (req, res, next) => {
  try {
    const { description, category } = req.body;
    const receiverEmail = String(req.body.receiverEmail || '').trim().toLowerCase();
    const numAmount = normalizeAmount(req.body.amount);

    // cant transfer to self
    if (receiverEmail === req.user.email) {
      return sendError(res, 'Cannot transfer to yourself', 400);
    }

    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return sendError(res, 'Receiver not found', 404);
    }

    if (receiver.status === 'blocked') {
      return sendError(res, 'Receiver account is blocked', 400);
    }

    const senderWalletDoc = await Wallet.findOne({ userId: req.user._id });
    if (!senderWalletDoc) {
      return sendError(res, 'Wallet not found', 404);
    }

    // check suspicious rules for sender
    const suspiciousResult = await evaluateAllRules(
      req.user._id, numAmount, 'transfer', req.user.createdAt, senderWalletDoc.balance
    );

    const senderBalanceBefore = senderWalletDoc.balance;

    // Atomic debit with balance guard (same race protection as withdraw)
    const senderWallet = await Wallet.findOneAndUpdate(
      { userId: req.user._id, balance: { $gte: numAmount } },
      { $inc: { balance: -numAmount, totalTransfersOut: numAmount } },
      { new: true }
    );

    if (!senderWallet) {
      await createTransaction({
        senderId: req.user._id,
        receiverId: receiver._id,
        amount: numAmount,
        type: 'transfer',
        status: 'failed',
        description: 'Insufficient balance for transfer'
      });
      return sendError(res, 'Insufficient balance', 400);
    }

    // Credit the receiver. If this ever fails after the debit succeeded,
    // roll the debit back so money is never lost in between.
    let receiverWallet;
    try {
      receiverWallet = await Wallet.findOneAndUpdate(
        { userId: receiver._id },
        { $inc: { balance: numAmount, totalTransfersIn: numAmount } },
        { new: true }
      );
      if (!receiverWallet) throw new Error('Receiver wallet not found');
    } catch (creditErr) {
      await Wallet.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { balance: numAmount, totalTransfersOut: -numAmount } }
      );
      throw creditErr;
    }

    const txn = await createTransaction({
      senderId: req.user._id,
      receiverId: receiver._id,
      amount: numAmount,
      type: 'transfer',
      status: suspiciousResult.isSuspicious ? 'flagged' : 'successful',
      category: category || 'Transfer',
      description: description || `Transfer to ${receiver.name}`,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderWallet.balance,
      suspiciousFlag: suspiciousResult.isSuspicious,
      suspiciousReasons: suspiciousResult.reasons
    });

    // notify sender
    await createNotification(
      req.user._id,
      'Transfer Sent',
      `${numAmount.toLocaleString()} PKR sent to ${receiver.name}`,
      'transaction',
      txn.transactionId
    );

    // notify receiver
    await createNotification(
      receiver._id,
      'Transfer Received',
      `${numAmount.toLocaleString()} PKR received from ${req.user.name}`,
      'transaction',
      txn.transactionId
    );

    if (senderWallet.balance < 1000) {
      await createNotification(
        req.user._id,
        'Low Balance Warning',
        `Your wallet balance is low: ${senderWallet.balance.toLocaleString()} PKR`,
        'account'
      );
    }

    sendSuccess(res, {
      transaction: txn,
      newBalance: senderWallet.balance
    }, 'Transfer successful');
  } catch (err) {
    next(err);
  }
};

module.exports = { getWallet, getWalletSummary, deposit, withdraw, transfer };
