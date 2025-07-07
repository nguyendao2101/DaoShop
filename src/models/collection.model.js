// src/models/collection.model.js
const mongoose = require('mongoose');
const { logger } = require('../config/logger');

// Schema cho bộ sưu tập sản phẩm
const collectionSchema = new mongoose.Schema({
    idColection: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    urlImage: {
        type: String,
        required: true,
        validate: {
            validator: function (url) {
                return url && url.length > 0 && (
                    url.startsWith('http://') ||
                    url.startsWith('https://') ||
                    url.startsWith('//') ||
                    url.startsWith('data:image/') ||
                    url.startsWith('/')
                );
            },
            message: 'URL hình ảnh không hợp lệ'
        }
    },
    listProduct: {
        type: Map,
        of: String,
        required: true,
        validate: {
            validator: function (productList) {
                if (productList instanceof Map) {
                    return productList.size > 0;
                } else if (typeof productList === 'object' && productList !== null) {
                    return Object.keys(productList).length > 0;
                }
                return false;
            },
            message: 'Bộ sưu tập phải có ít nhất một sản phẩm'
        }
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    totalProducts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'collectionProduct'
});

// Middleware để xử lý dữ liệu trước khi save
collectionSchema.pre('save', function (next) {
    // Chuyển đổi object thông thường thành Map nếu cần
    if (this.listProduct && !(this.listProduct instanceof Map)) {
        this.listProduct = new Map(Object.entries(this.listProduct));
    }

    // Tính tổng số sản phẩm
    if (this.listProduct) {
        const productObj = this.listProduct instanceof Map ?
            Object.fromEntries(this.listProduct) : this.listProduct;
        this.totalProducts = Object.keys(productObj).length;
    }

    next();
});

// Indexes
collectionSchema.index({ name: 'text' });
collectionSchema.index({ isActive: 1 });
collectionSchema.index({ displayOrder: 1 });

// Instance methods
collectionSchema.methods.getProductIds = function () {
    const productObj = this.listProduct instanceof Map ?
        Object.fromEntries(this.listProduct) : this.listProduct;
    return Object.values(productObj);
};

collectionSchema.methods.getUniqueProductIds = function () {
    const productIds = this.getProductIds();
    return [...new Set(productIds)];
};

collectionSchema.methods.hasProduct = function (productId) {
    const productIds = this.getProductIds();
    return productIds.includes(productId);
};

collectionSchema.methods.addProduct = function (productId) {
    if (!this.listProduct || typeof this.listProduct !== 'object') {
        this.listProduct = {};
    }

    // Chuyển Map thành Object nếu cần
    let productList = this.listProduct instanceof Map
        ? Object.fromEntries(this.listProduct)
        : this.listProduct;

    // Tìm index tiếp theo
    const existingKeys = Object.keys(productList).map(key => parseInt(key));
    const nextIndex = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 0;

    // Thêm sản phẩm mới
    productList[nextIndex.toString()] = productId;

    // Cập nhật lại listProduct
    this.listProduct = productList;

    // Cập nhật totalProducts
    this.totalProducts = Object.keys(productList).length;
};

collectionSchema.methods.removeProduct = function (productId) {
    const productObj = this.listProduct instanceof Map ?
        Object.fromEntries(this.listProduct) : this.listProduct;

    const newProductObj = {};
    let index = 0;

    for (const [key, value] of Object.entries(productObj)) {
        if (value !== productId) {
            newProductObj[index.toString()] = value;
            index++;
        }
    }

    this.listProduct = newProductObj;
    this.markModified('listProduct');
    return this;
};

// Static methods
collectionSchema.statics.searchCollections = async function (filters = {}) {
    const {
        keyword,
        isActive,
        sortBy = 'displayOrder',
        sortOrder = 'asc',
        page = 1,
        limit = 10
    } = filters;
    const matchConditions = {};

    // Chỉ thêm isActive filter nếu được truyền vào cụ thể
    if (isActive !== undefined && isActive !== null) {
        matchConditions.isActive = isActive;
    }

    if (keyword) {
        // Sử dụng regex thay vì text search nếu không có text index
        matchConditions.name = { $regex: keyword, $options: 'i' };
    }

    const sortCondition = {};
    sortCondition[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const result = await this.find(matchConditions)
        .sort(sortCondition)
        .skip(skip)
        .limit(parseInt(limit));
    return result;
};

collectionSchema.statics.getPopularCollections = async function (limit = 10) {
    return this.find({})
        .sort({ displayOrder: 1, totalProducts: -1, createdAt: -1 })
        .limit(parseInt(limit));
};
collectionSchema.statics.getPopularCollections = async function (limit = 10) {
    return this.find({})
        .sort({ displayOrder: 1, totalProducts: -1, createdAt: -1 })
        .limit(parseInt(limit));
};

const Collection = mongoose.model('Collection', collectionSchema);
module.exports = Collection;