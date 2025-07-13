// src/controllers/payment.controller.js
const { validationResult } = require('express-validator');
const StripeService = require('../services/stripe.service');
const PurchaseHistoryService = require('../services/purchase-history.service');
const PurchaseHistory = require('../models/purchase-history.model');
const env = require('../config/env');
const logger = require('../config/logger');

class PaymentController {
    // Tạo Payment Intent
    static async createPaymentIntent(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.user.userId;
            const orderData = {
                ...req.body,
                userId: userId,
                customerEmail: req.user.email
            };

            console.log('💳 Creating payment intent for user:', userId);

            const result = await StripeService.createPaymentIntent(orderData);

            res.json(result);
        } catch (error) {
            logger.error('Create payment intent error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Tạo Checkout Session
    static async createCheckoutSession(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.user.userId;
            const orderData = {
                ...req.body,
                userId: userId
            };

            const customerData = {
                email: req.user.email,
                name: req.user.fullName || req.user.userName
            };

            console.log('💳 Creating checkout session for user:', userId);

            const result = await StripeService.createCheckoutSession(orderData, customerData);

            res.json(result);
        } catch (error) {
            logger.error('Create checkout session error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Confirm Payment và tạo Purchase Record
    static async confirmPayment(req, res) {
        try {
            const { paymentIntentId, orderId } = req.body;
            const userId = req.user.userId;

            console.log('💳 Confirming payment:', paymentIntentId);

            // Get payment status from Stripe
            const paymentResult = await StripeService.confirmPayment(paymentIntentId);

            if (paymentResult.data.status === 'succeeded') {
                // Update purchase history
                const updateResult = await PurchaseHistoryService.updateOrderStatus(
                    orderId,
                    'confirmed',
                    {
                        notes: `Payment confirmed via Stripe. Payment Intent: ${paymentIntentId}`
                    }
                );

                // Update payment status and Stripe info
                await PurchaseHistory.findOneAndUpdate(
                    { orderId },
                    {
                        paymentStatus: 'paid',
                        paymentMethod: 'stripe',
                        stripePaymentIntentId: paymentIntentId
                    }
                );

                res.json({
                    success: true,
                    data: {
                        payment: paymentResult.data,
                        order: updateResult.data
                    },
                    message: 'Payment confirmed and order updated successfully'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: `Payment failed with status: ${paymentResult.data.status}`
                });
            }
        } catch (error) {
            logger.error('Confirm payment error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get Payment Status
    static async getPaymentStatus(req, res) {
        try {
            const { paymentIntentId } = req.params;

            console.log('💳 Getting payment status:', paymentIntentId);

            const result = await StripeService.getPaymentStatus(paymentIntentId);

            res.json(result);
        } catch (error) {
            logger.error('Get payment status error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Handle Successful Checkout (từ Stripe redirect)
    static async handleCheckoutSuccess(req, res) {
        try {
            const { session_id, order_id } = req.query;

            console.log('Handling checkout success:', { session_id, order_id });

            if (!session_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Session ID is required'
                });
            }

            // Get session details from Stripe
            const sessionResult = await StripeService.getCheckoutSession(session_id);
            const session = sessionResult.data;

            if (session.paymentStatus === 'paid') {
                // Update purchase history
                await PurchaseHistoryService.updateOrderStatus(
                    order_id,
                    'confirmed',
                    {
                        notes: `Payment completed via Stripe Checkout. Session: ${session_id}`
                    }
                );

                // Update payment info
                await PurchaseHistory.findOneAndUpdate(
                    { orderId: order_id },
                    {
                        paymentStatus: 'paid',
                        paymentMethod: 'stripe',
                        stripePaymentIntentId: session.paymentIntentId,
                        stripeSessionId: session_id
                    }
                );

                res.json({
                    success: true,
                    data: {
                        orderId: order_id,
                        sessionId: session_id,
                        paymentStatus: session.paymentStatus,
                        amountTotal: session.amountTotal
                    },
                    message: 'Payment completed successfully'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: `Payment not completed. Status: ${session.paymentStatus}`
                });
            }
        } catch (error) {
            logger.error('Handle checkout success error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    static async triggerTestWebhook(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { eventType, orderId, paymentIntentId } = req.body;

            console.log('🧪 Triggering test webhook:', { eventType, orderId });

            // Create mock payment intent object
            const mockPaymentIntent = {
                id: paymentIntentId || `pi_mock_${Date.now()}`,
                status: eventType.includes('succeeded') ? 'succeeded' : 'failed',
                amount: 29900000, // 299,000 VND in cents
                currency: 'vnd',
                metadata: {
                    orderId: orderId || `ORD-TEST-${Date.now()}`,
                    userId: req.user.userId
                },
                created: Math.floor(Date.now() / 1000)
            };

            // Manually call webhook handlers
            switch (eventType) {
                case 'payment_intent.succeeded':
                    await PaymentController.handlePaymentSuccess(mockPaymentIntent);
                    break;
                case 'payment_intent.payment_failed':
                    await PaymentController.handlePaymentFailed(mockPaymentIntent);
                    break;
                case 'checkout.session.completed':
                    const mockSession = {
                        id: `cs_mock_${Date.now()}`,
                        payment_intent: mockPaymentIntent.id,
                        payment_status: 'paid',
                        metadata: mockPaymentIntent.metadata
                    };
                    await PaymentController.handleCheckoutCompleted(mockSession);
                    break;
                default:
                    throw new Error(`Unsupported event type: ${eventType}`);
            }

            res.json({
                success: true,
                data: {
                    eventType,
                    mockPaymentIntent,
                    orderId: mockPaymentIntent.metadata.orderId
                },
                message: `Test webhook ${eventType} triggered successfully`
            });

        } catch (error) {
            logger.error('Test webhook error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Test payment configuration
    static async testPaymentConfig(req, res) {
        try {
            const stripe = require('stripe')(env.stripe.secretKey);

            // Test Stripe connection
            const account = await stripe.accounts.retrieve();

            res.json({
                success: true,
                data: {
                    stripeConnected: true,
                    accountId: account.id,
                    environment: env.env,
                    webhookSecret: env.stripe.webhookSecret ? 'Configured' : 'Missing',
                    successUrl: env.stripe.successUrl,
                    cancelUrl: env.stripe.cancelUrl
                },
                message: 'Payment configuration test successful'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: `Payment configuration test failed: ${error.message}`
            });
        }
    }

    // ADD: Create test order for payment testing
    static async createTestOrder(req, res) {
        try {
            const userId = req.user.userId;
            const orderId = `ORD-TEST-${Date.now()}`;

            // Mock order data
            const testOrderData = {
                orderId,
                userId,
                items: [
                    {
                        productId: 'test-product-1',
                        nameProduct: 'Test Product 1',
                        quantity: 2,
                        unitPrice: 149500,
                        size: 'M',
                        productImage: 'https://example.com/test-image.jpg'
                    }
                ],
                totalAmount: 329000, // 299,000 + 30,000 shipping
                shippingFee: 30000,
                discount: 0,
                shippingAddress: {
                    fullName: 'Test User',
                    phone: '0123456789',
                    address: '123 Test Street',
                    ward: 'Test Ward',
                    district: 'Test District',
                    province: 'Test Province'
                },
                paymentMethod: 'stripe',
                orderStatus: 'pending',
                paymentStatus: 'pending'
            };

            // Create purchase history record
            const PurchaseHistory = require('../models/purchase-history.model');
            const newOrder = new PurchaseHistory(testOrderData);
            await newOrder.save();

            res.json({
                success: true,
                data: {
                    orderId,
                    totalAmount: testOrderData.totalAmount,
                    items: testOrderData.items,
                    orderStatus: 'pending',
                    paymentStatus: 'pending'
                },
                message: 'Test order created successfully'
            });
        } catch (error) {
            logger.error('Create test order error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get order status for testing
    static async getOrderStatus(req, res) {
        try {
            const { orderId } = req.params;

            const PurchaseHistory = require('../models/purchase-history.model');
            const order = await PurchaseHistory.findOne({ orderId }).lean();

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                data: {
                    orderId: order.orderId,
                    orderStatus: order.orderStatus,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod,
                    totalAmount: order.totalAmount,
                    stripePaymentIntentId: order.stripePaymentIntentId,
                    stripeSessionId: order.stripeSessionId,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                },
                message: 'Order status retrieved successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Process Refund
    static async processRefund(req, res) {
        try {
            const { orderId } = req.params;
            const { amount, reason } = req.body;

            console.log('💳 Processing refund for order:', orderId);

            // Get order info
            const order = await PurchaseHistory.findOne({ orderId });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (!order.stripePaymentIntentId) {
                return res.status(400).json({
                    success: false,
                    message: 'No Stripe payment found for this order'
                });
            }

            // Process refund
            const refundResult = await StripeService.refundPayment(
                order.stripePaymentIntentId,
                amount
            );

            // Update order status
            await PurchaseHistoryService.updateOrderStatus(
                orderId,
                'returned',
                {
                    notes: `Refund processed via Stripe. Refund ID: ${refundResult.data.refundId}. Reason: ${reason || 'Customer request'}`
                }
            );

            // Update payment status
            await PurchaseHistory.findOneAndUpdate(
                { orderId },
                {
                    paymentStatus: amount < order.totalAmount ? 'partial_refund' : 'refunded'
                }
            );

            res.json({
                success: true,
                data: refundResult.data,
                message: 'Refund processed successfully'
            });
        } catch (error) {
            logger.error('Process refund error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Stripe Webhook Handler
    static async handleWebhook(req, res) {
        try {
            const signature = req.headers['stripe-signature'];
            const payload = req.body;

            console.log('Handling Stripe webhook...');
            // Validate webhook signature and parse event
            const event = StripeService.validateWebhookSignature(payload, signature);

            console.log('Webhook event type:', event.type);

            // Xử lý các loại event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await PaymentController.handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await PaymentController.handlePaymentFailed(event.data.object);
                    break;
                case 'checkout.session.completed':
                    await PaymentController.handleCheckoutCompleted(event.data.object);
                    break;
                case 'refund.created':
                    await PaymentController.handleRefundCreated(event.data.object);
                    break;
                default:
                    console.log('Unhandled webhook event type:', event.type);
            }

            res.json({ received: true });
        } catch (error) {
            logger.error('Webhook handler error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Handle Payment Success Webhook
    static async handlePaymentSuccess(paymentIntent) {
        try {
            const orderId = paymentIntent.metadata && paymentIntent.metadata.orderId;
            if (!orderId) {
                logger.warn('PaymentIntent missing orderId metadata, skipping order update.');
                return;
            }
            console.log('Payment succeeded for order:', orderId);

            await PurchaseHistoryService.updateOrderStatus(
                orderId,
                'confirmed',
                {
                    notes: `Payment completed automatically via webhook. Payment Intent: ${paymentIntent.id}`
                }
            );

            await PurchaseHistory.findOneAndUpdate(
                { orderId },
                {
                    paymentStatus: 'paid',
                    paymentMethod: 'stripe',
                    stripePaymentIntentId: paymentIntent.id
                }
            );

        } catch (error) {
            logger.error('Handle payment success error:', error);
        }
    }

    static async getOrderBySessionId(req, res) {
        const { sessionId } = req.params;
        // Tìm order theo sessionId (lưu sessionId vào DB khi xử lý webhook)
        const order = await PurchaseHistory.findOne({ stripeSessionId: sessionId });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ order });
    }

    // Handle Payment Failed Webhook
    static async handlePaymentFailed(paymentIntent) {
        try {
            const orderId = paymentIntent.metadata.orderId;
            console.log('Payment failed for order:', orderId);

            await PurchaseHistoryService.updateOrderStatus(
                orderId,
                'cancelled',
                {
                    notes: `Payment failed. Payment Intent: ${paymentIntent.id}`
                }
            );

            await PurchaseHistory.findOneAndUpdate(
                { orderId },
                {
                    paymentStatus: 'failed',
                    stripePaymentIntentId: paymentIntent.id
                }
            );

        } catch (error) {
            logger.error('Handle payment failed error:', error);
        }
    }

    // Handle Checkout Completed Webhook
    static async handleCheckoutCompleted(session) {
        try {
            const orderId = session.metadata.orderId;
            console.log('Checkout completed for order:', orderId);

            await PurchaseHistoryService.updateOrderStatus(
                orderId,
                'confirmed',
                {
                    notes: `Checkout completed via webhook. Session: ${session.id}`
                }
            );

            await PurchaseHistory.findOneAndUpdate(
                { orderId },
                {
                    paymentStatus: 'paid',
                    paymentMethod: 'stripe',
                    stripeSessionId: session.id,
                    stripePaymentIntentId: session.payment_intent
                }
            );

        } catch (error) {
            logger.error('Handle checkout completed error:', error);
        }
    }

    // Handle Refund Created Webhook
    static async handleRefundCreated(refund) {
        try {
            console.log('Refund created:', refund.id);
            // Additional logic for refund handling if needed
        } catch (error) {
            logger.error('Handle refund created error:', error);
        }
    }
}

module.exports = PaymentController;