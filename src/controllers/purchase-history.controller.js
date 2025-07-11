// src/controllers/purchase-history.controller.js
const PurchaseHistoryService = require('../services/purchase-history.service');

class PurchaseHistoryController {
    // GET /api/purchase-history - Lấy lịch sử mua hàng
    static async getPurchaseHistory(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                page: req.query.page,
                limit: req.query.limit,
                orderStatus: req.query.orderStatus,
                paymentStatus: req.query.paymentStatus,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                orderId: req.query.orderId
            };

            const result = await PurchaseHistoryService.getPurchaseHistory(userId, filters);
            return res.status(200).json(result);
        } catch (error) {
            console.error('PurchaseHistoryController.getPurchaseHistory error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/purchase-history/:orderId - Lấy chi tiết đơn hàng
    static async getOrderDetail(req, res) {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;

            const result = await PurchaseHistoryService.getOrderDetail(userId, orderId);
            return res.status(200).json(result);
        } catch (error) {
            console.error(' PurchaseHistoryController.getOrderDetail error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/purchase-history/stats - Thống kê mua hàng
    static async getPurchaseStats(req, res) {
        try {
            const userId = req.user.id;
            const result = await PurchaseHistoryService.getPurchaseStats(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('PurchaseHistoryController.getPurchaseStats error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/purchase-history/create - Tạo record mua hàng (admin/system)
    static async createPurchaseRecord(req, res) {
        try {
            const orderData = req.body;
            const result = await PurchaseHistoryService.createPurchaseRecord(orderData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('PurchaseHistoryController.createPurchaseRecord error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // PUT /api/purchase-history/:orderId/status - Cập nhật trạng thái đơn hàng
    static async updateOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status, trackingNumber, deliveryDate, notes } = req.body;

            const result = await PurchaseHistoryService.updateOrderStatus(
                orderId,
                status,
                { trackingNumber, deliveryDate, notes }
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('PurchaseHistoryController.updateOrderStatus error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = PurchaseHistoryController;