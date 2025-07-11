const express = require('express');
const WishlistController = require('../controllers/wishlist.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Authentication middleware cho tất cả wishlist routes
router.use(authenticateToken);

// GET /api/wishlist - Lấy danh sách yêu thích
router.get('/', WishlistController.getWishlist);

// POST /api/wishlist/add - Thêm vào wishlist
router.post('/add', WishlistController.addToWishlist);

// DELETE /api/wishlist/remove/:productId - Xóa khỏi wishlist
router.delete('/remove/:productId', WishlistController.removeFromWishlist);

// GET /api/wishlist/check/:productId - Kiểm tra trong wishlist
router.get('/check/:productId', WishlistController.checkWishlist);

// DELETE /api/wishlist/clear - Xóa toàn bộ wishlist
router.delete('/clear', WishlistController.clearWishlist);

module.exports = router;