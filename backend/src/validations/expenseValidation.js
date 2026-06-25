const { body } = require('express-validator');

const expenseValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title is too long'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be positive'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
];

module.exports = { expenseValidation };
