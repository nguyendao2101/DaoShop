// src/controllers/cart.controller.js
const CartService = require('../services/cart.service');

class CartController {
    // GET /api/cart - Lấy giỏ hàng
    static async getCart(req, res) {
        try {
            const userId = req.user.id; // Từ auth middleware
            const result = await CartService.getCart(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('CartController.getCart error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/cart/add - Thêm vào giỏ hàng
    static async addToCart(req, res) {
        try {
            const { productId, sizeIndex, quantity, price } = req.body;
            const userId = req.user.userId;

            console.log('CartController.addToCart received:', {
                userId,
                productId,
                sizeIndex: sizeIndex + ' (type: ' + typeof sizeIndex + ')',
                quantity,
                price
            });

            // Validation
            if (!productId || sizeIndex === undefined || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: productId, sizeIndex, quantity'
                });
            }

            // Đảm bảo quantity là số nguyên dương
            const validQuantity = parseInt(quantity);
            if (isNaN(validQuantity) || validQuantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be a positive integer'
                });
            }

            // Đảm bảo sizeIndex là số
            const validSizeIndex = parseInt(sizeIndex);
            if (isNaN(validSizeIndex) || validSizeIndex < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Size index must be a non-negative integer'
                });
            }

            console.log('Validation passed. Calling service with:', {
                userId,
                productId,
                sizeIndex: validSizeIndex,
                quantity: validQuantity,
                price
            });

            const result = await CartService.addToCart(
                userId,
                productId,
                validSizeIndex,
                validQuantity,
                price
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('CartController.addToCart error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // PUT /api/cart/update - Cập nhật số lượng
    static async updateQuantity(req, res) {
        try {
            const userId = req.user.id;
            const { productId, sizeIndex, quantity } = req.body;

            const result = await CartService.updateQuantity(
                userId,
                productId,
                parseInt(sizeIndex),
                parseInt(quantity)
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('CartController.updateQuantity error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /api/cart/remove - Xóa item
    static async removeItem(req, res) {
        try {
            const userId = req.user.id;
            const { productId, sizeIndex } = req.params;

            const result = await CartService.removeItem(
                userId,
                productId,
                parseInt(sizeIndex)
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('CartController.removeItem error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /api/cart/clear - Xóa toàn bộ giỏ hàng
    static async clearCart(req, res) {
        try {
            const userId = req.user.id;
            const result = await CartService.clearCart(userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('CartController.clearCart error:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = CartController;