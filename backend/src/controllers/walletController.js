const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const generateTransactionId = require('../utils/generateTransactionId');
const { evaluateAllRules } = require('../utils/suspiciousRules');
const createNotification = require('../utils/createNotification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

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
    const { amount, description, category } = req.body;
    const numAmount = parseFloat(amount);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return sendError(res, 'Wallet not found', 404);

    const balanceBefore = wallet.balance;

    // check suspicious rules
    const suspiciousResult = await evaluateAllRules(
      req.user._id, numAmount, 'deposit', req.user.createdAt, wallet.balance
    );

    // update wallet
    wallet.balance += numAmount;
    wallet.totalDeposits += numAmount;
    await wallet.save();

    // create transaction record
    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
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
    const { amount, description, category } = req.body;
    const numAmount = parseFloat(amount);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return sendError(res, 'Wallet not found', 404);

    if (wallet.balance < numAmount) {
      // record failed transaction
      await Transaction.create({
        transactionId: generateTransactionId(),
        senderId: req.user._id,
        amount: numAmount,
        type: 'withdrawal',
        status: 'failed',
        description: 'Insufficient balance',
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance
      });
      return sendError(res, 'Insufficient balance', 400);
    }

    const balanceBefore = wallet.balance;

    const suspiciousResult = await evaluateAllRules(
      req.user._id, numAmount, 'withdrawal', req.user.createdAt, wallet.balance
    );

    wallet.balance -= numAmount;
    wallet.totalWithdrawals += numAmount;
    await wallet.save();

    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
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
    const { receiverEmail, amount, description, category } = req.body;
    const numAmount = parseFloat(amount);

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

    const senderWallet = await Wallet.findOne({ userId: req.user._id });
    const receiverWallet = await Wallet.findOne({ userId: receiver._id });

    if (!senderWallet || !receiverWallet) {
      return sendError(res, 'Wallet not found', 404);
    }

    if (senderWallet.balance < numAmount) {
      await Transaction.create({
        transactionId: generateTransactionId(),
        senderId: req.user._id,
        receiverId: receiver._id,
        amount: numAmount,
        type: 'transfer',
        status: 'failed',
        description: 'Insufficient balance for transfer'
      });
      return sendError(res, 'Insufficient balance', 400);
    }

    const senderBalanceBefore = senderWallet.balance;
    const receiverBalanceBefore = receiverWallet.balance;

    // check suspicious rules for sender
    const suspiciousResult = await evaluateAllRules(
      req.user._id, numAmount, 'transfer', req.user.createdAt, senderWallet.balance
    );

    // update both wallets
    senderWallet.balance -= numAmount;
    senderWallet.totalTransfersOut += numAmount;
    await senderWallet.save();

    receiverWallet.balance += numAmount;
    receiverWallet.totalTransfersIn += numAmount;
    await receiverWallet.save();

    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
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
