// src/routes/collection.route.js
const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/collection.controller');
const { cache } = require('../middlewares/cacheMiddleware');

/**
 * @swagger
 * tags:
 *   name: Collections
 *   description: API quản lý bộ sưu tập sản phẩm
 */

// Debug route - đặt ở đầu để tránh conflict với /:id
router.get('/debug/info', CollectionController.debugCollections);

// Routes phổ biến - đặt trước /:id để tránh conflict
router.get('/popular', cache(30 * 60), CollectionController.getPopularCollections);

// Routes chính
router.get('/', cache(5 * 60), CollectionController.getAllCollections); // Giảm cache time để debug
router.get('/:id', cache(15 * 60), CollectionController.getCollectionById);
router.get('/:id/products', cache(10 * 60), CollectionController.getProductsInCollection);

// Admin routes
router.post('/', CollectionController.createCollection);
router.put('/:id', CollectionController.updateCollection);
router.delete('/:id', CollectionController.deleteCollection);
router.post('/:id/products', CollectionController.addProductToCollection);
router.delete('/:id/products/:productId', CollectionController.removeProductFromCollection);

module.exports = router;