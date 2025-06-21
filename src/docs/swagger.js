// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DaoShop API',
            version: '1.0.0',
            description: `
# DaoShop API Documentation

Complete API documentation for the DaoShop e-commerce platform.

## Rate Limiting

This API implements rate limiting to protect against abuse:

- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes
- **Registration**: 3 registrations per hour
- **OTP**: 3 OTP requests per 10 minutes

When rate limit is exceeded, the API returns HTTP 429 (Too Many Requests) with retry information.
            `
        },
        servers: [
            {
                url: 'http://localhost:8797',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '64f123abc456def789012345' },
                        userName: { type: 'string', example: 'johndoe123' },
                        email: { type: 'string', example: 'john@example.com' },
                        isEmailVerified: { type: 'boolean', example: true }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' }
                    }
                },
                RateLimitError: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Too many requests, please try again later'
                        },
                        retryAfter: {
                            type: 'number',
                            description: 'Số giây cần đợi trước khi thử lại',
                            example: 900
                        }
                    }
                }
            },
            responses: {
                RateLimitExceeded: {
                    description: 'Too Many Requests - Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RateLimitError'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js'] // Chỉ scan routes
};

const specs = swaggerJsdoc(options);

module.exports = {
    specs,
    swaggerUi
};