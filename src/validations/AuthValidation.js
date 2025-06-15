// src/validations/AuthValidation.js
const { body } = require('express-validator');

const registerValidation = [
    body('userName')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers and underscores'),

    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
];

const loginValidation = [
    body('identifier')
        .trim()
        .notEmpty()
        .withMessage('Username or email is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const verifyOTPValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email'),

    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers')
];

const resendOTPValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
];

// ✅ Export both individual validations and grouped object
module.exports = {
    registerValidation,
    loginValidation,
    verifyOTPValidation,
    resendOTPValidation,
    authValidation: {
        register: registerValidation,
        login: loginValidation,
        verifyOTP: verifyOTPValidation,
        resendOTP: resendOTPValidation
    }
};