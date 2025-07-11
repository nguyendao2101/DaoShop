// src/routes/purchase-history.route.js - FIX COMPLETE
const express = require('express');
const PurchaseHistoryController = require('../controllers/purchase-history.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Authentication middleware cho tất cả purchase history routes
router.use(authenticateToken);

// GET /api/purchase-history - Lịch sử mua hàng
router.get('/', PurchaseHistoryController.getPurchaseHistory);

// GET /api/purchase-history/stats - Thống kê mua hàng
router.get('/stats', PurchaseHistoryController.getPurchaseStats);

// GET /api/purchase-history/:orderId - Chi tiết đơn hàng
router.get('/:orderId', PurchaseHistoryController.getOrderDetail);

// POST /api/purchase-history/create - Tạo record mua hàng
router.post('/create', PurchaseHistoryController.createPurchaseRecord);

// PUT /api/purchase-history/:orderId/status - Cập nhật trạng thái đơn hàng
router.put('/:orderId/status', PurchaseHistoryController.updateOrderStatus);

module.exports = router;