// src/services/purchase-history.service.js
const PurchaseHistory = require('../models/purchase-history.model');
const Product = require('../models/product.model');

class PurchaseHistoryService {
    // Lấy lịch sử mua hàng
    static async getPurchaseHistory(userId, filters = {}) {
        try {
            console.log(`Getting purchase history for user: ${userId}`);

            const {
                page = 1,
                limit = 10,
                orderStatus,
                paymentStatus,
                startDate,
                endDate,
                orderId
            } = filters;

            // Build query conditions
            const matchConditions = { userId };

            if (orderStatus) {
                matchConditions.orderStatus = orderStatus;
            }

            if (paymentStatus) {
                matchConditions.paymentStatus = paymentStatus;
            }

            if (orderId) {
                matchConditions.orderId = { $regex: orderId, $options: 'i' };
            }

            if (startDate || endDate) {
                matchConditions.purchaseDate = {};
                if (startDate) {
                    matchConditions.purchaseDate.$gte = new Date(startDate);
                }
                if (endDate) {
                    matchConditions.purchaseDate.$lte = new Date(endDate);
                }
            }

            // Execute query with pagination
            const skip = (page - 1) * limit;

            const [orders, totalCount] = await Promise.all([
                PurchaseHistory.find(matchConditions)
                    .sort({ purchaseDate: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                PurchaseHistory.countDocuments(matchConditions)
            ]);

            // Populate product details
            const ordersWithProducts = await Promise.all(
                orders.map(async (order) => {
                    const itemsWithProducts = await Promise.all(
                        order.items.map(async (item) => {
                            const product = await Product.findOne({ id: item.productId });
                            return {
                                ...item.toObject(),
                                productDetails: product || null
                            };
                        })
                    );

                    return {
                        ...order.toObject(),
                        items: itemsWithProducts
                    };
                })
            );

            return {
                success: true,
                data: {
                    orders: ordersWithProducts,
                    pagination: {
                        total: totalCount,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalCount / limit),
                        hasNextPage: page < Math.ceil(totalCount / limit),
                        hasPrevPage: page > 1
                    }
                },
                message: 'Purchase history retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting purchase history:', error);
            throw new Error(`Failed to get purchase history: ${error.message}`);
        }
    }

    // Tạo record mua hàng mới
    static async createPurchaseRecord(orderData) {
        try {
            console.log(`📜 Creating purchase record: ${orderData.orderId}`);

            const {
                userId,
                orderId,
                items,
                totalAmount,
                paymentMethod = 'cod',
                deliveryAddress,
                shippingFee = 0,
                discount = 0,
                notes
            } = orderData;

            // Validate required fields
            if (!userId || !orderId || !items || !totalAmount) {
                throw new Error('Missing required fields: userId, orderId, items, totalAmount');
            }

            // Check if order already exists
            const existingOrder = await PurchaseHistory.findOne({ orderId });
            if (existingOrder) {
                throw new Error('Order ID already exists');
            }

            // Validate and format items
            const formattedItems = await Promise.all(
                items.map(async (item) => {
                    const product = await Product.findOne({ id: item.productId });
                    if (!product) {
                        throw new Error(`Product not found: ${item.productId}`);
                    }

                    const sizePrice = product.sizePrice[item.sizeIndex || 0];
                    if (!sizePrice) {
                        throw new Error(`Size not available for product: ${item.productId}`);
                    }

                    return {
                        productId: item.productId,
                        nameProduct: product.nameProduct,
                        sizeIndex: item.sizeIndex || 0,
                        size: sizePrice.size || 'Default',
                        quantity: item.quantity,
                        unitPrice: item.unitPrice || sizePrice.price,
                        totalPrice: (item.unitPrice || sizePrice.price) * item.quantity,
                        productImage: product.productImg?.[0] || null
                    };
                })
            );

            // Create purchase record
            const purchaseRecord = new PurchaseHistory({
                userId,
                orderId,
                items: formattedItems,
                totalAmount,
                paymentMethod,
                deliveryAddress,
                shippingFee,
                discount,
                notes,
                purchaseDate: new Date()
            });

            await purchaseRecord.save();

            return {
                success: true,
                data: purchaseRecord,
                message: 'Purchase record created successfully'
            };
        } catch (error) {
            console.error('Error creating purchase record:', error);
            throw new Error(`Failed to create purchase record: ${error.message}`);
        }
    }

    // Cập nhật trạng thái đơn hàng
    static async updateOrderStatus(orderId, status, additionalData = {}) {
        try {
            console.log(`Updating order status: ${orderId} -> ${status}`);

            const order = await PurchaseHistory.findOne({ orderId });
            if (!order) {
                throw new Error('Order not found');
            }

            // Validate status
            const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'];
            if (!validOrderStatuses.includes(status)) {
                throw new Error('Invalid order status');
            }

            // Update order
            order.orderStatus = status;

            // Update additional fields if provided
            if (additionalData.trackingNumber) {
                order.trackingNumber = additionalData.trackingNumber;
            }

            if (additionalData.deliveryDate) {
                order.deliveryDate = new Date(additionalData.deliveryDate);
            }

            if (additionalData.notes) {
                order.notes = additionalData.notes;
            }

            await order.save();

            return {
                success: true,
                data: order,
                message: 'Order status updated successfully'
            };
        } catch (error) {
            console.error('Error updating order status:', error);
            throw new Error(`Failed to update order status: ${error.message}`);
        }
    }

    // Cập nhật trạng thái thanh toán
    static async updatePaymentStatus(orderId, paymentStatus) {
        try {
            console.log(`📜 Updating payment status: ${orderId} -> ${paymentStatus}`);

            const order = await PurchaseHistory.findOne({ orderId });
            if (!order) {
                throw new Error('Order not found');
            }

            const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'partial_refund'];
            if (!validPaymentStatuses.includes(paymentStatus)) {
                throw new Error('Invalid payment status');
            }

            order.paymentStatus = paymentStatus;
            await order.save();

            return {
                success: true,
                data: order,
                message: 'Payment status updated successfully'
            };
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw new Error(`Failed to update payment status: ${error.message}`);
        }
    }

    // Lấy chi tiết một đơn hàng
    static async getOrderDetail(userId, orderId) {
        try {
            console.log(`Getting order detail: ${orderId}`);

            const order = await PurchaseHistory.findOne({
                orderId,
                userId
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Populate product details
            const itemsWithProducts = await Promise.all(
                order.items.map(async (item) => {
                    const product = await Product.findOne({ id: item.productId });
                    return {
                        ...item.toObject(),
                        productDetails: product || null
                    };
                })
            );

            const orderWithProducts = {
                ...order.toObject(),
                items: itemsWithProducts
            };

            return {
                success: true,
                data: orderWithProducts,
                message: 'Order detail retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting order detail:', error);
            throw new Error(`Failed to get order detail: ${error.message}`);
        }
    }

    // Thống kê mua hàng
    static async getPurchaseStats(userId) {
        try {
            console.log(`📜 Getting purchase stats for user: ${userId}`);

            const stats = await PurchaseHistory.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: '$totalAmount' },
                        avgOrderValue: { $avg: '$totalAmount' },
                        ordersByStatus: {
                            $push: '$orderStatus'
                        }
                    }
                }
            ]);

            const statusCounts = {};
            if (stats.length > 0) {
                stats[0].ordersByStatus.forEach(status => {
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
            }

            return {
                success: true,
                data: {
                    totalOrders: stats[0]?.totalOrders || 0,
                    totalSpent: stats[0]?.totalSpent || 0,
                    avgOrderValue: stats[0]?.avgOrderValue || 0,
                    ordersByStatus: statusCounts
                },
                message: 'Purchase stats retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting purchase stats:', error);
            throw new Error(`Failed to get purchase stats: ${error.message}`);
        }
    }
}

module.exports = PurchaseHistoryService;