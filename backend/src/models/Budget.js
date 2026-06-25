const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: [true, 'Month is required (YYYY-MM format)'],
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
  },
  totalLimit: {
    type: Number,
    required: [true, 'Budget limit is required'],
    min: [1, 'Limit must be greater than 0']
  },
  categoryLimits: [{
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 1 }
  }],
  spentAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['safe', 'nearLimit', 'exceeded'],
    default: 'safe'
  },
  warningThreshold: {
    type: Number,
    default: 75
  }
}, {
  timestamps: true
});

// one budget per user per month
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
