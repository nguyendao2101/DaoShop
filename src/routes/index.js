const authRouter = require('./auth.route');

function route(app) {
    app.use('/api/auth', authRouter);
    app.get('/', (req, res) => {
        res.json({
            message: 'DaoShop API is running!',
            version: '1.0.0'
        });
    });
}

module.exports = route;