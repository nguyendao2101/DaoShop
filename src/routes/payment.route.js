// src/routes/payment.route.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const PaymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentIntent:
 *       type: object
 *       required:
 *         - orderId
 *         - totalAmount
 *         - items
 *       properties:
 *         orderId:
 *           type: string
 *           example: "ORD-1234567890"
 *         totalAmount:
 *           type: number
 *           example: 299000
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               nameProduct:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *         shippingFee:
 *           type: number
 *           example: 30000
 *         discount:
 *           type: number
 *           example: 50000
 */

/**
 * @swagger
 * /api/payment/create-intent:
 *   post:
 *     summary: Create Stripe Payment Intent
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntent'
 *     responses:
 *       200:
 *         description: Payment Intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientSecret:
 *                       type: string
 *                     paymentIntentId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 */
router.post('/create-intent', authenticateToken, [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
    body('items').isArray({ min: 1 }).withMessage('Items array is required with at least 1 item')
], PaymentController.createPaymentIntent);

/**
 * @swagger
 * /api/payment/create-checkout:
 *   post:
 *     summary: Create Stripe Checkout Session
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntent'
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 */
router.post('/create-checkout', authenticateToken, [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
    body('items').isArray({ min: 1 }).withMessage('Items array is required with at least 1 item')
], PaymentController.createCheckoutSession);

/**
 * @swagger
 * /api/payment/confirm:
 *   post:
 *     summary: Confirm payment and update order
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *               - orderId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 */
router.post('/confirm', authenticateToken, [
    body('paymentIntentId').notEmpty().withMessage('Payment Intent ID is required'),
    body('orderId').notEmpty().withMessage('Order ID is required')
], PaymentController.confirmPayment);

/**
 * @swagger
 * /api/payment/status/{paymentIntentId}:
 *   get:
 *     summary: Get payment status
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 */
router.get('/status/:paymentIntentId', authenticateToken, PaymentController.getPaymentStatus);

/**
 * @swagger
 * /api/payment/success:
 *   get:
 *     summary: Handle successful checkout redirect
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checkout success handled
 */
router.get('/success', PaymentController.handleCheckoutSuccess);

/**
 * @swagger
 * /api/payment/refund/{orderId}:
 *   post:
 *     summary: Process refund for order
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Partial refund amount (optional - full refund if not provided)
 *               reason:
 *                 type: string
 *                 description: Refund reason
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post('/refund/:orderId', authenticateToken, [
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('reason').optional().isString().withMessage('Reason must be a string')
], PaymentController.processRefund);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payment]
 *     description: Handle Stripe webhook events (payment success, failure, etc.)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
// router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);


/**
 * @swagger
 * /api/payment/test-webhook:
 *   post:
 *     summary: Trigger test webhook event (Development only)
 *     tags: [Payment - Testing]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - orderId
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum: [payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed]
 *                 example: "payment_intent.succeeded"
 *               orderId:
 *                 type: string
 *                 example: "ORD-TEST-001"
 *               paymentIntentId:
 *                 type: string
 *                 example: "pi_test_123456"
 *     responses:
 *       200:
 *         description: Test webhook triggered successfully
 */
router.post('/test-webhook', authenticateToken, [
    body('eventType').isIn([
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'checkout.session.completed'
    ]).withMessage('Invalid event type'),
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentIntentId').optional().isString()
], PaymentController.triggerTestWebhook);

/**
 * @swagger
 * /api/payment/test-config:
 *   get:
 *     summary: Test payment configuration
 *     tags: [Payment - Testing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment configuration test results
 */
router.get('/test-config', authenticateToken, PaymentController.testPaymentConfig);

/**
 * @swagger
 * /api/payment/create-test-order:
 *   post:
 *     summary: Create test order for payment testing
 *     tags: [Payment - Testing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Test order created successfully
 */
router.post('/create-test-order', authenticateToken, PaymentController.createTestOrder);

/**
 * @swagger
 * /api/payment/order-status/{orderId}:
 *   get:
 *     summary: Get order status for testing
 *     tags: [Payment - Testing]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status retrieved successfully
 */
router.get('/order-status/:orderId', authenticateToken, PaymentController.getOrderStatus);
router.get('/order-by-session/:sessionId', PaymentController.getOrderBySessionId);

module.exports = router;