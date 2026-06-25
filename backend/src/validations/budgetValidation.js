const { body } = require('express-validator');

const budgetValidation = [
  body('month')
    .notEmpty().withMessage('Month is required')
    .matches(/^\d{4}-\d{2}$/).withMessage('Month must be YYYY-MM format'),
  body('totalLimit')
    .notEmpty().withMessage('Total limit is required')
    .isFloat({ gt: 0 }).withMessage('Limit must be greater than 0'),
  body('categoryLimits')
    .optional()
    .isArray().withMessage('Category limits must be an array'),
  body('warningThreshold')
    .optional()
    .isFloat({ min: 1, max: 99 }).withMessage('Threshold must be between 1-99')
];

module.exports = { budgetValidation };
