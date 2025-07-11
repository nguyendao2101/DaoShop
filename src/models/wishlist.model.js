// src/models/wishlist.model.js
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        productId: {
            type: String,
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    totalItems: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'wishlists'
});

// Indexes
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ userId: 1, 'items.productId': 1 });
wishlistSchema.index({ 'items.productId': 1 });

// Calculate total items
wishlistSchema.methods.calculateTotal = function () {
    this.totalItems = this.items.length;
};

// Pre-save middleware
wishlistSchema.pre('save', function (next) {
    this.calculateTotal();
    next();
});

module.exports = mongoose.model('Wishlist', wishlistSchema);