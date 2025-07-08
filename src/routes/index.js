// src/routes/index.js
const authRouter = require('./auth.route');
const productRouter = require('./product.route');
const collectionRouter = require('./collection.route');
const { specs, swaggerUi } = require('../docs/swagger');
const commentRoute = require('./comment.route');

function route(app) {
    // API routes
    app.use('/api/auth', authRouter);
    app.use('/api/products', productRouter);
    app.use('/api/collections', collectionRouter);
    app.use('/api/comments', commentRoute);

    // Swagger documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'DaoShop API Documentation'
    }));

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            message: 'DaoShop API is running!',
            version: '1.0.0',
            documentation: 'http://localhost:8797/api-docs',
            endpoints: {
                auth: '/api/auth',
                products: '/api/products',
                collections: '/api/collections'
            }
        });
    });

    // 404 handler for unknown routes
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found",
            requestedPath: req.path,
            availableRoutes: {
                docs: "/api-docs",
                auth: "/api/auth/*",
                products: "/api/products/*",
                collections: "/api/collections/*",
                test: "/test-google"
            }
        });
    });
}

module.exports = route;