const WishlistService = require('../services/wishlist.service');

class WishlistController {
    // GET /api/wishlist - Lấy danh sách yêu thích
    static async getWishlist(req, res) {
        try {
            const userId = req.user.userId;
            const { page, limit } = req.query;

            console.log('Getting wishlist for userId:', userId);

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
            const userId = req.user.userId;
            const { productId } = req.body;

            //ADD COMPREHENSIVE DEBUG LOGS
            console.log('WishlistController.addToWishlist - Debug Info:', {
                userId: userId,
                'req.body': req.body,
                'req.body type': typeof req.body,
                'Object.keys(req.body)': Object.keys(req.body),
                'JSON.stringify(req.body)': JSON.stringify(req.body),
                productId: productId,
                'productId type': typeof productId,
                'req.headers[content-type]': req.headers['content-type'],
                'req.method': req.method,
                'req.url': req.url
            });

            if (!productId) {
                console.log('Missing productId in request body');
                console.log('Available body keys:', Object.keys(req.body));
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required',
                    debug: {
                        receivedBody: req.body,
                        bodyKeys: Object.keys(req.body),
                        contentType: req.headers['content-type']
                    }
                });
            }

            console.log('ProductId received:', productId);
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
            const userId = req.user.userId;
            const { productId } = req.params;

            console.log('Remove from wishlist:', { userId, productId });

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
            const userId = req.user.userId;
            const { productId } = req.params;

            console.log('Check wishlist:', { userId, productId });

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
            const userId = req.user.userId;

            console.log('Clear wishlist for userId:', userId);

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