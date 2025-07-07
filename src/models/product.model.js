// src/models/products.model.js
const mongoose = require('mongoose');

// Schema cho size và giá
const sizePriceSchema = new mongoose.Schema({
    size: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, { _id: false });

// Schema chính cho sản phẩm
const productsSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    nameProduct: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    material: {
        type: String,
        required: true,
        trim: true
    },
    karat: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Nam', 'Nữ', 'Unisex']
    },
    productImg: {
        type: Map,
        of: String,
        required: true,
        validate: {
            validator: function (images) {
                // Kiểm tra nếu images là object thông thường thay vì Map
                if (images instanceof Map) {
                    return images.size > 0;
                } else if (typeof images === 'object' && images !== null) {
                    return Object.keys(images).length > 0;
                }
                return false;
            },
            message: 'Ít nhất phải có 1 hình ảnh sản phẩm'
        }
    },
    sizePrice: {
        type: Map,
        of: sizePriceSchema,
        required: true,
        validate: {
            validator: function (sizePrice) {
                // Kiểm tra nếu sizePrice là object thông thường thay vì Map
                if (sizePrice instanceof Map) {
                    return sizePrice.size > 0;
                } else if (typeof sizePrice === 'object' && sizePrice !== null) {
                    return Object.keys(sizePrice).length > 0;
                }
                return false;
            },
            message: 'Phải có ít nhất một kích thước và giá'
        }
    },
    listComments: {
        type: Map,
        of: String,
        default: () => new Map([["0", "none"]])
    },
    listEvaluation: {
        type: Map,
        of: String,
        default: () => new Map([["0", "none"]])
    },
    show: {
        type: String,
        enum: ['true', 'false'],
        default: 'true'
    },
    // Các trường bổ sung
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    totalSold: {
        type: Number,
        default: 0,
        min: 0
    },
    avgRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
}, {
    timestamps: true,
    collection: 'products'
});

// Middleware để xử lý dữ liệu trước khi save
productsSchema.pre('save', function (next) {
    // Chuyển đổi object thông thường thành Map nếu cần
    if (this.productImg && !(this.productImg instanceof Map)) {
        this.productImg = new Map(Object.entries(this.productImg));
    }

    if (this.sizePrice && !(this.sizePrice instanceof Map)) {
        this.sizePrice = new Map(Object.entries(this.sizePrice));
    }

    if (this.listComments && !(this.listComments instanceof Map)) {
        this.listComments = new Map(Object.entries(this.listComments));
    }

    if (this.listEvaluation && !(this.listEvaluation instanceof Map)) {
        this.listEvaluation = new Map(Object.entries(this.listEvaluation));
    }

    // Đảm bảo ID sản phẩm viết hoa
    if (this.isModified('id')) {
        this.id = this.id.toUpperCase();
    }

    next();
});

// Indexes để tối ưu tìm kiếm
productsSchema.index({ nameProduct: 'text', description: 'text' });
productsSchema.index({ category: 1, type: 1 });
productsSchema.index({ show: 1 });
productsSchema.index({ gender: 1 });
productsSchema.index({ material: 1 });
productsSchema.index({ karat: 1 });

// Phương thức instance: Lấy giá thấp nhất
productsSchema.methods.getLowestPrice = function () {
    let lowestPrice = Infinity;
    const sizePriceObj = this.sizePrice instanceof Map ?
        Object.fromEntries(this.sizePrice) : this.sizePrice;

    for (const key in sizePriceObj) {
        const price = sizePriceObj[key].price;
        if (price < lowestPrice) {
            lowestPrice = price;
        }
    }
    return lowestPrice === Infinity ? 0 : lowestPrice;
};

// Phương thức instance: Lấy giá cao nhất
productsSchema.methods.getHighestPrice = function () {
    let highestPrice = 0;
    const sizePriceObj = this.sizePrice instanceof Map ?
        Object.fromEntries(this.sizePrice) : this.sizePrice;

    for (const key in sizePriceObj) {
        const price = sizePriceObj[key].price;
        if (price > highestPrice) {
            highestPrice = price;
        }
    }
    return highestPrice;
};

// Phương thức instance: Tính tổng tồn kho
productsSchema.methods.getTotalStock = function () {
    let totalStock = 0;
    const sizePriceObj = this.sizePrice instanceof Map ?
        Object.fromEntries(this.sizePrice) : this.sizePrice;

    for (const key in sizePriceObj) {
        totalStock += sizePriceObj[key].stock;
    }
    return totalStock;
};

// Phương thức instance: Kiểm tra còn hàng
productsSchema.methods.isInStock = function () {
    return this.getTotalStock() > 0;
};

// Phương thức static: Tìm kiếm sản phẩm
productsSchema.statics.searchProducts = async function (filters = {}) {
    const {
        category,
        type,
        gender,
        material,
        karat,
        minPrice,
        maxPrice,
        keyword,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
        onlyVisible = true
    } = filters;

    // Xây dựng query filter
    const matchConditions = {};

    if (onlyVisible) {
        matchConditions.show = 'true';
    }

    if (category) {
        matchConditions.category = category.toUpperCase();
    }

    if (type) {
        matchConditions.type = type;
    }

    if (gender) {
        matchConditions.gender = gender;
    }

    if (material) {
        matchConditions.material = material;
    }

    if (karat) {
        matchConditions.karat = karat;
    }

    if (keyword) {
        matchConditions.$text = { $search: keyword };
    }

    // Aggregation pipeline
    const pipeline = [
        { $match: matchConditions }
    ];

    // Lọc theo giá nếu có
    if (minPrice || maxPrice) {
        pipeline.push({
            $addFields: {
                sizePriceArray: { $objectToArray: "$sizePrice" },
                lowestPrice: {
                    $min: {
                        $map: {
                            input: { $objectToArray: "$sizePrice" },
                            as: "item",
                            in: "$$item.v.price"
                        }
                    }
                }
            }
        });

        const priceConditions = {};
        if (minPrice) priceConditions.$gte = parseFloat(minPrice);
        if (maxPrice) priceConditions.$lte = parseFloat(maxPrice);

        pipeline.push({
            $match: {
                lowestPrice: priceConditions
            }
        });
    }

    // Sắp xếp
    const sortCondition = {};
    sortCondition[sortBy] = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortCondition });

    // Phân trang
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    return this.aggregate(pipeline);
};

const Products = mongoose.model('Products', productsSchema);
module.exports = Products;