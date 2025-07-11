// src/services/wishlist.service.js
const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');

class WishlistService {
    // Lấy danh sách yêu thích
    static async getWishlist(userId, page = 1, limit = 20) {
        try {
            console.log(`Getting wishlist for user: ${userId}`);

            let wishlist = await Wishlist.findOne({ userId });

            if (!wishlist) {
                wishlist = new Wishlist({ userId, items: [] });
                await wishlist.save();
            }

            // Pagination
            const skip = (page - 1) * limit;
            const totalItems = wishlist.items.length;
            const paginatedItems = wishlist.items
                .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)) // Sort by newest first
                .slice(skip, skip + limit);

            // Get product details for paginated items
            const productDetails = await Promise.all(
                paginatedItems.map(async (item) => {
                    const product = await Product.findOne({ id: item.productId });
                    return {
                        productId: item.productId,
                        addedAt: item.addedAt,
                        product: product || null
                    };
                })
            );

            // Filter out products that don't exist anymore
            const validItems = productDetails.filter(item => item.product !== null);

            return {
                success: true,
                data: {
                    items: validItems,
                    totalItems,
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    hasNextPage: page < Math.ceil(totalItems / limit),
                    hasPrevPage: page > 1
                },
                message: 'Wishlist retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting wishlist:', error);
            throw new Error(`Failed to get wishlist: ${error.message}`);
        }
    }

    // Thêm sản phẩm vào wishlist
    static async addToWishlist(userId, productId) {
        try {
            console.log(`Adding to wishlist: ${productId}`);

            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findOne({ id: productId });
            if (!product) {
                throw new Error('Product not found');
            }

            // Tìm hoặc tạo wishlist
            let wishlist = await Wishlist.findOne({ userId });
            if (!wishlist) {
                wishlist = new Wishlist({ userId, items: [] });
            }

            // Kiểm tra đã tồn tại chưa
            const existingItem = wishlist.items.find(item => item.productId === productId);
            if (existingItem) {
                return {
                    success: false,
                    message: 'Product already in wishlist'
                };
            }

            // Thêm vào wishlist
            wishlist.items.push({
                productId,
                addedAt: new Date()
            });

            await wishlist.save();

            return {
                success: true,
                data: wishlist,
                message: 'Product added to wishlist successfully'
            };
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            throw new Error(`Failed to add to wishlist: ${error.message}`);
        }
    }

    // Xóa sản phẩm khỏi wishlist
    static async removeFromWishlist(userId, productId) {
        try {
            console.log(`Removing from wishlist: ${productId}`);

            const wishlist = await Wishlist.findOne({ userId });
            if (!wishlist) {
                throw new Error('Wishlist not found');
            }

            const initialLength = wishlist.items.length;
            wishlist.items = wishlist.items.filter(item => item.productId !== productId);

            if (wishlist.items.length === initialLength) {
                return {
                    success: false,
                    message: 'Product not found in wishlist'
                };
            }

            await wishlist.save();

            return {
                success: true,
                data: wishlist,
                message: 'Product removed from wishlist successfully'
            };
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            throw new Error(`Failed to remove from wishlist: ${error.message}`);
        }
    }

    // Kiểm tra sản phẩm có trong wishlist không
    static async isInWishlist(userId, productId) {
        try {
            const wishlist = await Wishlist.findOne({ userId });
            if (!wishlist) {
                return { success: true, data: { isInWishlist: false } };
            }

            const isInWishlist = wishlist.items.some(item => item.productId === productId);

            return {
                success: true,
                data: { isInWishlist }
            };
        } catch (error) {
            console.error('Error checking wishlist:', error);
            throw new Error(`Failed to check wishlist: ${error.message}`);
        }
    }

    // Xóa toàn bộ wishlist
    static async clearWishlist(userId) {
        try {
            console.log(`Clearing wishlist for user: ${userId}`);

            const wishlist = await Wishlist.findOne({ userId });
            if (!wishlist) {
                throw new Error('Wishlist not found');
            }

            wishlist.items = [];
            await wishlist.save();

            return {
                success: true,
                data: wishlist,
                message: 'Wishlist cleared successfully'
            };
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            throw new Error(`Failed to clear wishlist: ${error.message}`);
        }
    }

    // Thêm nhiều sản phẩm cùng lúc (bulk add)
    static async addMultipleToWishlist(userId, productIds) {
        try {
            console.log(`Adding multiple products to wishlist: ${productIds.length} items`);

            const results = await Promise.all(
                productIds.map(productId => this.addToWishlist(userId, productId))
            );

            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            return {
                success: true,
                data: {
                    successful,
                    failed,
                    results
                },
                message: `Added ${successful} products to wishlist. ${failed} failed.`
            };
        } catch (error) {
            console.error('Error adding multiple to wishlist:', error);
            throw new Error(`Failed to add multiple to wishlist: ${error.message}`);
        }
    }
}

module.exports = WishlistService;