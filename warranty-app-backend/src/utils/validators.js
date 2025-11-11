const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateProduct = [
  body('product_name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 255 })
    .withMessage('Product name must be less than 255 characters'),
  body('purchase_date')
    .isISO8601()
    .withMessage('Purchase date must be a valid date (YYYY-MM-DD)'),
  body('warranty_duration_months')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Warranty duration must be between 1 and 120 months'),
  body('purchase_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  handleValidationErrors
];

exports.validateStore = [
  body('store_name')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ max: 255 })
    .withMessage('Store name must be less than 255 characters'),
  handleValidationErrors
];

