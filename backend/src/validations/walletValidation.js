const { body } = require('express-validator');

const depositValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0')
    .isFloat({ max: 1000000 }).withMessage('Maximum deposit is 1,000,000 PKR'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description too long')
];

const withdrawValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim()
];

const transferValidation = [
  body('receiverEmail')
    .trim()
    .notEmpty().withMessage('Receiver email is required')
    .isEmail().withMessage('Invalid receiver email'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim()
];

module.exports = { depositValidation, withdrawValidation, transferValidation };
