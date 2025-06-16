// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DaoShop API',
            version: '1.0.0',
            description: 'API documentation for DaoShop e-commerce platform'
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