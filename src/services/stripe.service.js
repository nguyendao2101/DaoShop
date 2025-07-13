// src/services/stripe.service.js
const stripe = require('stripe')(require('../config/env').stripe.secretKey);
const env = require('../config/env');
const logger = require('../config/logger');

class StripeService {
    // Tạo Payment Intent
    static async createPaymentIntent(orderData) {
        try {
            console.log('Creating Stripe Payment Intent for order:', orderData.orderId);

            // Convert amount to cents (Stripe requires cents)
            const amountInCents = Math.round(orderData.totalAmount);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'vnd', // Vietnamese Dong
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    orderId: orderData.orderId,
                    userId: orderData.userId.toString(),
                    itemCount: orderData.items.length.toString()
                },
                description: `DaoShop Order ${orderData.orderId}`,
                receipt_email: orderData.customerEmail || null
            });

            console.log('Payment Intent created:', paymentIntent.id);

            return {
                success: true,
                data: {
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: paymentIntent.status
                },
                message: 'Payment Intent created successfully'
            };
        } catch (error) {
            logger.error('Stripe createPaymentIntent error:', error);
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }
    }

    // Tạo Checkout Session (cho hosted checkout page)
    static async createCheckoutSession(orderData, customerData) {
        try {
            console.log('💳 Creating Stripe Checkout Session for order:', orderData.orderId);

            // Convert items for Stripe
            const lineItems = orderData.items.map(item => ({
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: item.nameProduct,
                        description: `Size: ${item.size}`,
                        images: item.productImage ? [item.productImage] : []
                    },
                    unit_amount: Math.round(item.unitPrice) // Convert to cents
                },
                quantity: item.quantity
            }));

            // Add shipping fee if exists
            if (orderData.shippingFee > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'vnd',
                        product_data: {
                            name: 'Shipping Fee'
                        },
                        unit_amount: Math.round(orderData.shippingFee)
                    },
                    quantity: 1
                });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${env.stripe.successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderData.orderId}`,
                cancel_url: `${env.stripe.cancelUrl}?order_id=${orderData.orderId}`,
                customer_email: customerData.email,
                metadata: {
                    orderId: orderData.orderId,
                    userId: orderData.userId.toString()
                },
                billing_address_collection: 'required',
                shipping_address_collection: {
                    allowed_countries: ['VN']
                },
                // Apply discount if exists
                ...(orderData.discount > 0 && {
                    discounts: [{
                        coupon: await this.createDiscountCoupon(orderData.discount)
                    }]
                })
            });

            console.log('Checkout Session created:', session.id);

            return {
                success: true,
                data: {
                    sessionId: session.id,
                    sessionUrl: session.url,
                    paymentIntentId: session.payment_intent
                },
                message: 'Checkout session created successfully'
            };
        } catch (error) {
            logger.error('Stripe createCheckoutSession error:', error);
            throw new Error(`Failed to create checkout session: ${error.message}`);
        }
    }

    // Tạo discount coupon cho Stripe
    static async createDiscountCoupon(discountAmount) {
        try {
            const coupon = await stripe.coupons.create({
                amount_off: Math.round(discountAmount),
                currency: 'vnd',
                duration: 'once',
                name: 'Order Discount'
            });
            return coupon.id;
        } catch (error) {
            logger.error('Error creating discount coupon:', error);
            return null;
        }
    }

    // Confirm Payment Intent
    static async confirmPayment(paymentIntentId) {
        try {
            console.log('Confirming payment:', paymentIntentId);

            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            return {
                success: true,
                data: {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    metadata: paymentIntent.metadata
                },
                message: 'Payment confirmed successfully'
            };
        } catch (error) {
            logger.error('Stripe confirmPayment error:', error);
            throw new Error(`Failed to confirm payment: ${error.message}`);
        }
    }

    // Get Payment Intent Status
    static async getPaymentStatus(paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            return {
                success: true,
                data: {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount, // Convert back from cents
                    currency: paymentIntent.currency,
                    created: paymentIntent.created,
                    metadata: paymentIntent.metadata
                }
            };
        } catch (error) {
            logger.error('Stripe getPaymentStatus error:', error);
            throw new Error(`Failed to get payment status: ${error.message}`);
        }
    }

    // Refund Payment
    static async refundPayment(paymentIntentId, amount = null) {
        try {
            console.log('💳 Processing refund for payment:', paymentIntentId);

            const refundData = {
                payment_intent: paymentIntentId
            };

            if (amount) {
                refundData.amount = Math.round(amount); // Convert to cents
            }

            const refund = await stripe.refunds.create(refundData);

            console.log('Refund processed:', refund.id);

            return {
                success: true,
                data: {
                    refundId: refund.id,
                    amount: refund.amount, // Convert back from cents
                    status: refund.status,
                    reason: refund.reason
                },
                message: 'Refund processed successfully'
            };
        } catch (error) {
            logger.error('Stripe refundPayment error:', error);
            throw new Error(`Failed to process refund: ${error.message}`);
        }
    }

    // Validate Webhook Signature
    static validateWebhookSignature(payload, signature) {
        try {
            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                env.stripe.webhookSecret
            );
            return event;
        } catch (error) {
            logger.error('Webhook signature validation failed:', error);
            throw new Error('Invalid webhook signature');
        }
    }

    // Get Checkout Session
    static async getCheckoutSession(sessionId) {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            return {
                success: true,
                data: {
                    id: session.id,
                    paymentStatus: session.payment_status,
                    paymentIntentId: session.payment_intent,
                    amountTotal: session.amount_total,
                    currency: session.currency,
                    customerEmail: session.customer_details?.email,
                    metadata: session.metadata
                }
            };
        } catch (error) {
            logger.error('Stripe getCheckoutSession error:', error);
            throw new Error(`Failed to get checkout session: ${error.message}`);
        }
    }
}

module.exports = StripeService;