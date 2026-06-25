const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'refund', 'fee'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed', 'flagged'],
    default: 'pending'
  },
  category: {
    type: String,
    default: 'General'
  },
  description: {
    type: String,
    default: ''
  },
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
  suspiciousFlag: {
    type: Boolean,
    default: false
  },
  suspiciousReasons: [{
    type: String
  }]
}, {
  timestamps: true
});

transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
