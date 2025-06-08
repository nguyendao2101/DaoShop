const { body } = require('express-validator');

const registerValidation = [
    body('userName')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers and underscores'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter and one number'),

    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
];

const loginValidation = [
    body('userName')
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

module.exports = {
    registerValidation,
    loginValidation
};