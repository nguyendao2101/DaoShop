// src/services/purchase-history.service.js - UPDATE getUserId conversion
const PurchaseHistory = require('../models/purchase-history.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');

class PurchaseHistoryService {
    // Lấy lịch sử mua hàng
    static async getPurchaseHistory(userId, filters = {}) {
        try {
            console.log(`📜 Getting purchase history for user: ${userId}`);

            //FIX: Convert string userId to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);

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
            const matchConditions = { userId: userObjectId }; // ✅ Use ObjectId

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

            console.log('🔍 Query conditions:', matchConditions);

            // Execute query with pagination
            const skip = (page - 1) * limit;

            const [orders, totalCount] = await Promise.all([
                PurchaseHistory.find(matchConditions)
                    .sort({ purchaseDate: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                PurchaseHistory.countDocuments(matchConditions)
            ]);

            console.log(`Found ${orders.length} orders out of ${totalCount} total`);

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

    // Lấy chi tiết một đơn hàng
    static async getOrderDetail(userId, orderId) {
        try {
            console.log(`📜 Getting order detail: ${orderId} for user: ${userId}`);

            //FIX: Convert string userId to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);

            const order = await PurchaseHistory.findOne({
                orderId,
                userId: userObjectId //Use ObjectId
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

            //FIX: Convert string userId to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);

            const stats = await PurchaseHistory.aggregate([
                { $match: { userId: userObjectId } }, // ✅ Use ObjectId
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

    static async createPurchaseRecord(orderData) {
        try {
            console.log('Creating purchase record:', {
                userId: orderData.userId,
                orderId: orderData.orderId,
                itemsCount: orderData.items?.length,
                totalAmount: orderData.totalAmount
            });

            // Validate required fields
            if (!orderData.userId || !orderData.orderId || !orderData.items || !Array.isArray(orderData.items)) {
                throw new Error('Missing required fields: userId, orderId, and items are required');
            }

            if (orderData.items.length === 0) {
                throw new Error('Order must contain at least one item');
            }

            // Convert userId to ObjectId if it's a string
            const userObjectId = typeof orderData.userId === 'string'
                ? new mongoose.Types.ObjectId(orderData.userId)
                : orderData.userId;

            // Process items to get product details and calculate totals
            const processedItems = await Promise.all(
                orderData.items.map(async (item) => {
                    // Validate item fields
                    if (!item.productId || !item.quantity || !item.unitPrice) {
                        throw new Error('Each item must have productId, quantity, and unitPrice');
                    }

                    // Get product details
                    const product = await Product.findOne({ id: item.productId });
                    if (!product) {
                        throw new Error(`Product not found: ${item.productId}`);
                    }

                    // Get size info
                    let size = 'Standard';
                    if (product.sizePrice && product.sizePrice.length > 0 && item.sizeIndex !== undefined) {
                        const sizeInfo = product.sizePrice[item.sizeIndex];
                        if (sizeInfo) {
                            size = sizeInfo.size || 'Standard';
                        }
                    }

                    // Get product image
                    let productImage = '';
                    if (product.productImg && product.productImg.length > 0) {
                        productImage = product.productImg[0].url || product.productImg[0];
                    }

                    // Calculate total price
                    const totalPrice = item.quantity * item.unitPrice;

                    return {
                        productId: item.productId,
                        nameProduct: product.nameProduct,
                        sizeIndex: item.sizeIndex || 0,
                        size: size,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: totalPrice,
                        productImage: productImage
                    };
                })
            );

            // Calculate total amount from items
            const calculatedTotal = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
            const finalTotal = calculatedTotal + (orderData.shippingFee || 0) - (orderData.discount || 0);

            // Create purchase history record
            const purchaseRecord = new PurchaseHistory({
                userId: userObjectId,
                orderId: orderData.orderId,
                items: processedItems,
                totalAmount: orderData.totalAmount || finalTotal,
                orderStatus: orderData.orderStatus || 'pending',
                paymentStatus: orderData.paymentStatus || 'pending',
                paymentMethod: orderData.paymentMethod || 'cod',
                deliveryAddress: orderData.deliveryAddress,
                shippingFee: orderData.shippingFee || 0,
                discount: orderData.discount || 0,
                notes: orderData.notes || '',
                purchaseDate: orderData.purchaseDate || new Date(),
                trackingNumber: orderData.trackingNumber || null,
                deliveryDate: orderData.deliveryDate || null
            });

            const savedRecord = await purchaseRecord.save();

            return {
                success: true,
                data: savedRecord,
                message: 'Purchase record created successfully'
            };
        } catch (error) {
            console.error('Error creating purchase record:', error);
            throw new Error(`Failed to create purchase record: ${error.message}`);
        }
    }

    static async updateOrderStatus(orderId, status, updateData = {}) {
        try {
            console.log(`📝 Updating order status: ${orderId} -> ${status}`);

            // Validate status
            const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid order status: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
            }

            // Build update object
            const updateObject = {
                orderStatus: status,
                updatedAt: new Date()
            };

            // Add optional fields if provided
            if (updateData.trackingNumber) {
                updateObject.trackingNumber = updateData.trackingNumber;
            }
            if (updateData.deliveryDate) {
                updateObject.deliveryDate = new Date(updateData.deliveryDate);
            }
            if (updateData.notes) {
                updateObject.notes = updateData.notes;
            }

            // Update specific payment status based on order status
            if (status === 'delivered') {
                updateObject.paymentStatus = 'paid';
                updateObject.deliveryDate = updateObject.deliveryDate || new Date();
            } else if (status === 'cancelled') {
                updateObject.paymentStatus = 'refunded';
            }

            const updatedOrder = await PurchaseHistory.findOneAndUpdate(
                { orderId },
                updateObject,
                { new: true, runValidators: true }
            );

            if (!updatedOrder) {
                throw new Error('Order not found');
            }

            console.log('✅ Order status updated successfully:', updatedOrder.orderId);

            return {
                success: true,
                data: updatedOrder,
                message: 'Order status updated successfully'
            };
        } catch (error) {
            console.error('Error updating order status:', error);
            throw new Error(`Failed to update order status: ${error.message}`);
        }
    }

    static async deletePurchaseRecord(orderId) {
        try {
            console.log(`🗑️ Deleting purchase record: ${orderId}`);

            const deletedRecord = await PurchaseHistory.findOneAndDelete({ orderId });

            if (!deletedRecord) {
                throw new Error('Purchase record not found');
            }

            console.log('✅ Purchase record deleted successfully:', orderId);

            return {
                success: true,
                message: 'Purchase record deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting purchase record:', error);
            throw new Error(`Failed to delete purchase record: ${error.message}`);
        }
    }

    static async getAllOrders(filters = {}) {
        try {
            console.log('📜 Getting all orders with filters:', filters);

            const {
                page = 1,
                limit = 20,
                orderStatus,
                paymentStatus,
                startDate,
                endDate,
                userId,
                orderId
            } = filters;

            // Build query conditions
            const matchConditions = {};

            if (orderStatus) {
                matchConditions.orderStatus = orderStatus;
            }

            if (paymentStatus) {
                matchConditions.paymentStatus = paymentStatus;
            }

            if (userId) {
                matchConditions.userId = new mongoose.Types.ObjectId(userId);
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

            console.log('🔍 Query conditions:', matchConditions);

            // Execute query with pagination
            const skip = (page - 1) * limit;

            const [orders, totalCount] = await Promise.all([
                PurchaseHistory.find(matchConditions)
                    .populate('userId', 'userName email fullName')
                    .sort({ purchaseDate: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                PurchaseHistory.countDocuments(matchConditions)
            ]);

            console.log(`📜 Found ${orders.length} orders out of ${totalCount} total`);

            return {
                success: true,
                data: {
                    orders,
                    pagination: {
                        total: totalCount,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalCount / limit),
                        hasNextPage: page < Math.ceil(totalCount / limit),
                        hasPrevPage: page > 1
                    }
                },
                message: 'All orders retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting all orders:', error);
            throw new Error(`Failed to get all orders: ${error.message}`);
        }
    }
}

module.exports = PurchaseHistoryService;