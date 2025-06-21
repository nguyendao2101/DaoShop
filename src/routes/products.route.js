// // src/routes/products.js
// const express = require('express');
// const router = express.Router();
// const { cache, clearCache } = require('../middlewares/cacheMiddleware');
// const ProductController = require('../controllers/ProductController');

// // Cache danh sách sản phẩm trong 5 phút
// router.get('/', cache(300), ProductController.getAllProducts);

// // Cache thông tin sản phẩm trong 10 phút
// router.get('/:id', cache(600), ProductController.getProductById);

// // Xóa cache khi có thay đổi
// router.post('/', (req, res, next) => {
//     clearCache('/api/products');
//     next();
// }, ProductController.createProduct);

// router.put('/:id', (req, res, next) => {
//     clearCache('/api/products');
//     next();
// }, ProductController.updateProduct);

// module.exports = router;