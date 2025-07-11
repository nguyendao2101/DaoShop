// src/routes/cart.route.js - FIX
const express = require('express');
const CartController = require('../controllers/cart.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả routes cần authentication
router.use(authenticateToken); // ✅ Dùng đúng tên method

// GET /api/cart - Lấy giỏ hàng
router.get('/', CartController.getCart);

// POST /api/cart/add - Thêm vào giỏ hàng
router.post('/add', CartController.addToCart);

// PUT /api/cart/update - Cập nhật số lượng
router.put('/update', CartController.updateQuantity);

// DELETE /api/cart/remove/:productId/:sizeIndex - Xóa item
router.delete('/remove/:productId/:sizeIndex', CartController.removeItem);

// DELETE /api/cart/clear - Xóa toàn bộ giỏ hàng
router.delete('/clear', CartController.clearCart);

module.exports = router;