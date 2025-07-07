// src/routes/products.route.js
const express = require('express');
const router = express.Router();
const ProductsController = require('../controllers/product.controller');
const { cache } = require('../middlewares/cacheMiddleware');

// Routes công khai (không cần authentication)
router.get('/categories', cache(30 * 60), ProductsController.getCategories); // Cache 30 minutes
router.get('/categories/:category/types', cache(30 * 60), ProductsController.getTypesByCategory);
router.get('/', cache(5 * 60), ProductsController.getAllProducts); // Cache 5 minutes
router.get('/:id', cache(10 * 60), ProductsController.getProductById); // Cache 10 minutes

// Routes Admin (cần authentication & authorization)
// Uncomment khi đã có middleware authentication
// const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
// router.post('/', isAuthenticated, isAdmin, ProductsController.createProduct);
// router.put('/:id', isAuthenticated, isAdmin, ProductsController.updateProduct);
// router.delete('/:id', isAuthenticated, isAdmin, ProductsController.deleteProduct);
// router.patch('/:id/stock', isAuthenticated, isAdmin, ProductsController.updateStock);

// Tạm thời không có middleware authentication
router.post('/', ProductsController.createProduct);
router.put('/:id', ProductsController.updateProduct);
router.delete('/:id', ProductsController.deleteProduct);
router.patch('/:id/stock', ProductsController.updateStock);

module.exports = router;