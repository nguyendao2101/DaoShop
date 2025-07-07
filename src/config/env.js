// src/config/env.js
const Joi = require('joi');
const dotenv = require('dotenv');
const { logger } = require('./logger');

// Load env vars
dotenv.config();

// Define validation schema
const envSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string()
            .valid('development', 'production', 'test')
            .default('development'),
        PORT: Joi.number().default(8797),

        // Database
        DB_URI: Joi.string().required()
            .description('MongoDB connection string'),

        // JWT
        JWT_SECRET: Joi.string().required().min(10)
            .description('JWT secret key for signing tokens'),
        JWT_EXPIRES_IN: Joi.string().default('1d')
            .description('JWT expiration time (e.g., 1d, 12h, 30m)'),
        REFRESH_TOKEN_SECRET: Joi.string().required().min(10)
            .description('Refresh token secret key'),
        REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d')
            .description('Refresh token expiration time'),

        // Google OAuth
        GOOGLE_CLIENT_ID: Joi.string().required()
            .description('Google OAuth client ID'),
        GOOGLE_CLIENT_SECRET: Joi.string().required()
            .description('Google OAuth client secret'),
        GOOGLE_CALLBACK_URL: Joi.string()
            .default('http://localhost:8797/api/auth/google/callback')
            .description('Google OAuth callback URL'),

        // Frontend
        FRONTEND_URL: Joi.string()
            .default('http://localhost:3000')
            .description('Frontend application URL'),

        // Email
        SMTP_HOST: Joi.string()
            .description('SMTP server host'),
        SMTP_PORT: Joi.number()
            .description('SMTP server port'),
        SMTP_USER: Joi.string()
            .description('SMTP server username'),
        SMTP_PASS: Joi.string()
            .description('SMTP server password'),
        EMAIL_FROM: Joi.string()
            .description('Email sender address'),

        // Session
        SESSION_SECRET: Joi.string().min(10).default('daoshop-secret')
            .description('Session secret key'),

        // Rate limiting
        DISABLE_RATE_LIMIT: Joi.boolean().default(false)
            .description('Disable rate limiting (development only)'),
    })
    .unknown();

// Validate env vars
const { error, value: envVars } = envSchema.validate(process.env, {
    abortEarly: false,
    convert: true,
});

if (error) {
    const missingKeys = [];
    const invalidKeys = [];

    error.details.forEach((detail) => {
        if (detail.type === 'any.required') {
            missingKeys.push(detail.context.key);
        } else {
            invalidKeys.push({
                key: detail.context.key,
                message: detail.message,
            });
        }
    });

    logger.error('❌ Environment variables validation error:');

    if (missingKeys.length > 0) {
        logger.error('Missing required environment variables:');
        missingKeys.forEach(key => logger.error(`  - ${key}`));
    }

    if (invalidKeys.length > 0) {
        logger.error('Invalid environment variables:');
        invalidKeys.forEach(({ key, message }) => logger.error(`  - ${key}: ${message}`));
    }

    logger.error('\nPlease check your .env file and restart the server.');
    process.exit(1);
}

// Export validated env vars
const env = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,

    db: {
        uri: envVars.DB_URI,
    },

    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN,
        refreshSecret: envVars.REFRESH_TOKEN_SECRET,
        refreshExpiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
    },

    google: {
        clientId: envVars.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET,
        callbackUrl: envVars.GOOGLE_CALLBACK_URL,
    },

    frontend: {
        url: envVars.FRONTEND_URL,
    },

    email: {
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT,
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
        from: envVars.EMAIL_FROM,
    },

    session: {
        secret: envVars.SESSION_SECRET,
    },

    rateLimiting: {
        disabled: envVars.DISABLE_RATE_LIMIT,
    },
};

module.exports = env;