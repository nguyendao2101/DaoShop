// src/controllers/wishlist.controller.js
const WishlistService = require('../services/wishlist.service');

class WishlistController {
    // GET /api/wishlist - Lấy danh sách yêu thích
    static async getWishlist(req, res) {
        try {
            const userId = req.user.id;
            const { page, limit } = req.query;

            const result = await WishlistService.getWishlist(
                userId,
                parseInt(page) || 1,
                parseInt(limit) || 20
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('WishlistController.getWishlist error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/wishlist/add - Thêm vào wishlist
    static async addToWishlist(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required'
                });
            }

            const result = await WishlistService.addToWishlist(userId, productId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('WishlistController.addToWishlist error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /api/wishlist/remove/:productId - Xóa khỏi wishlist
    static async removeFromWishlist(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            const result = await WishlistService.removeFromWishlist(userId, productId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('WishlistController.removeFromWishlist error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/wishlist/check/:productId - Kiểm tra có trong wishlist không
    static async checkWishlist(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            const result = await WishlistService.isInWishlist(userId, productId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('WishlistController.checkWishlist error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /api/wishlist/clear - Xóa toàn bộ wishlist
    static async clearWishlist(req, res) {
        try {
            const userId = req.user.id;
            const result = await WishlistService.clearWishlist(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('WishlistController.clearWishlist error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = WishlistController;