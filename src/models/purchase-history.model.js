// src/models/purchase-history.model.js
const mongoose = require('mongoose');

const purchaseHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: String,
            required: true
        },
        nameProduct: {
            type: String,
            required: true
        },
        sizeIndex: {
            type: Number,
            default: 0
        },
        size: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        productImage: String
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'bank_transfer', 'credit_card', 'e_wallet', 'stripe'],
        default: 'cod'
    },
    stripePaymentIntentId: {
        type: String,
        default: null
    },
    stripeSessionId: {
        type: String,
        default: null
    },
    stripeTax: {
        type: Number,
        default: 0,
        min: 0
    },
    deliveryAddress: {
        fullName: String,
        phone: String,
        street: String,
        ward: String,
        district: String,
        city: String,
        zipCode: String
    },
    deliveryAddress: {
        fullName: String,
        phone: String,
        street: String,
        ward: String,
        district: String,
        city: String,
        zipCode: String
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: String,
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: Date,
    trackingNumber: String
}, {
    timestamps: true,
    collection: 'purchase_history'
});

// Indexes for queries
purchaseHistorySchema.index({ userId: 1, purchaseDate: -1 });
purchaseHistorySchema.index({ orderId: 1 });
purchaseHistorySchema.index({ orderStatus: 1 });
purchaseHistorySchema.index({ paymentStatus: 1 });
purchaseHistorySchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('PurchaseHistory', purchaseHistorySchema);