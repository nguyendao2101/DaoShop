// src/services/cart.service.js 
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

class CartService {
    static async addToCart(userId, productId, sizeIndex, quantity, price) {
        try {
            console.log('CartService.addToCart called with:', {
                userId,
                productId,
                sizeIndex,
                quantity,
                price
            });

            const product = await Product.findOne({ id: productId });
            if (!product) {
                console.log('Product not found:', productId);
                throw new Error('Product not found');
            }

            console.log('📦 Product found:', product.nameProduct || product.name);

            // Kiểm tra sizePrice structure
            let sizePriceObj;
            if (product.sizePrice instanceof Map) {
                sizePriceObj = Object.fromEntries(product.sizePrice);
            } else if (Array.isArray(product.sizePrice)) {
                // Nếu sizePrice là array thì convert thành object với index
                sizePriceObj = {};
                product.sizePrice.forEach((size, index) => {
                    sizePriceObj[index] = size;
                });
            } else {
                sizePriceObj = product.sizePrice;
            }

            console.log('📏 Available sizes:', Object.keys(sizePriceObj));
            console.log('🔍 Looking for sizeIndex:', sizeIndex, 'type:', typeof sizeIndex);

            // Kiểm tra size có tồn tại không
            const sizeIndexStr = String(sizeIndex);
            if (!sizePriceObj.hasOwnProperty(sizeIndexStr)) {
                console.log('Size not found. Available indexes:', Object.keys(sizePriceObj));
                console.log('SizePrice structure:', sizePriceObj);
                throw new Error(`Size index ${sizeIndex} not available. Available sizes: ${Object.keys(sizePriceObj).join(', ')}`);
            }

            const sizeData = sizePriceObj[sizeIndexStr];
            console.log('📏 Size data found:', sizeData);

            // Kiểm tra stock nếu có
            if (sizeData.stock !== undefined && sizeData.stock < quantity) {
                throw new Error(`Insufficient stock. Available: ${sizeData.stock}, Requested: ${quantity}`);
            }

            // Tìm hoặc tạo cart cho user
            let cart = await Cart.findOne({ userId });
            if (!cart) {
                console.log('🛒 Creating new cart for user:', userId);
                cart = new Cart({
                    userId,
                    items: [],
                    totalAmount: 0,
                    totalItems: 0
                });
            }

            // Kiểm tra sản phẩm đã có trong cart chưa
            const existingItemIndex = cart.items.findIndex(
                item => item.productId === productId && item.sizeIndex === sizeIndex
            );

            const itemPrice = price || sizeData.price || 0;

            if (existingItemIndex > -1) {
                // Cập nhật quantity nếu sản phẩm đã có
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;

                // Kiểm tra lại tồn kho với quantity mới
                if (sizeData.stock !== undefined && sizeData.stock < newQuantity) {
                    throw new Error(`Insufficient stock for total quantity. Available: ${sizeData.stock}, Requested total: ${newQuantity}`);
                }

                cart.items[existingItemIndex].quantity = newQuantity;
                cart.items[existingItemIndex].price = itemPrice;
                console.log('📈 Updated existing item quantity to:', newQuantity);
            } else {
                // Thêm item mới
                cart.items.push({
                    productId,
                    sizeIndex,
                    quantity,
                    price: itemPrice,
                    addedAt: new Date()
                });
                console.log('Added new item to cart');
            }

            // Tính lại tổng
            this.calculateCartTotals(cart);
            await cart.save();

            console.log('Cart saved successfully. Total items:', cart.totalItems);

            return {
                success: true,
                message: 'Product added to cart successfully',
                data: cart
            };

        } catch (error) {
            console.error('Error in CartService.addToCart:', error);
            throw new Error(`Failed to add to cart: ${error.message}`);
        }
    }

    // Helper method để tính tổng cart
    static calculateCartTotals(cart) {
        cart.totalItems = cart.items.length;
        cart.totalAmount = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        cart.lastUpdated = new Date();
    }

    // GET cart
    static async getCart(userId) {
        try {
            let cart = await Cart.findOne({ userId });

            if (!cart) {
                // Tạo cart mới nếu chưa có
                cart = new Cart({
                    userId,
                    items: [],
                    totalAmount: 0,
                    totalItems: 0
                });
                await cart.save();
            }

            return {
                success: true,
                data: cart,
                message: 'Cart retrieved successfully'
            };
        } catch (error) {
            console.error('Error in CartService.getCart:', error);
            throw new Error(`Failed to get cart: ${error.message}`);
        }
    }

    // UPDATE quantity
    static async updateQuantity(userId, productId, sizeIndex, quantity) {
        try {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                throw new Error('Cart not found');
            }

            const itemIndex = cart.items.findIndex(
                item => item.productId === productId && item.sizeIndex === sizeIndex
            );

            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            if (quantity <= 0) {
                // Xóa item nếu quantity <= 0
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
            }

            this.calculateCartTotals(cart);
            await cart.save();

            return {
                success: true,
                message: 'Cart updated successfully',
                data: cart
            };
        } catch (error) {
            console.error('Error in CartService.updateQuantity:', error);
            throw new Error(`Failed to update cart: ${error.message}`);
        }
    }

    // REMOVE item
    static async removeItem(userId, productId, sizeIndex) {
        try {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                throw new Error('Cart not found');
            }

            const itemIndex = cart.items.findIndex(
                item => item.productId === productId && item.sizeIndex === sizeIndex
            );

            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            cart.items.splice(itemIndex, 1);
            this.calculateCartTotals(cart);
            await cart.save();

            return {
                success: true,
                message: 'Item removed from cart successfully',
                data: cart
            };
        } catch (error) {
            console.error('Error in CartService.removeItem:', error);
            throw new Error(`Failed to remove item: ${error.message}`);
        }
    }

    // CLEAR cart
    static async clearCart(userId) {
        try {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                throw new Error('Cart not found');
            }

            cart.items = [];
            cart.totalAmount = 0;
            cart.totalItems = 0;
            cart.lastUpdated = new Date();
            await cart.save();

            return {
                success: true,
                message: 'Cart cleared successfully',
                data: cart
            };
        } catch (error) {
            console.error('Error in CartService.clearCart:', error);
            throw new Error(`Failed to clear cart: ${error.message}`);
        }
    }
}

module.exports = CartService;