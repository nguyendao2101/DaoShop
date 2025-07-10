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

    console.log(`🔍 Search filters:`, filters);

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

    console.log('Match conditions:', matchConditions);

    // Aggregation pipeline
    const pipeline = [
        { $match: matchConditions },

        // ADD FIELDS FOR PRICE CALCULATIONS - FIXED
        {
            $addFields: {
                // Convert sizePrice Map to array for processing
                sizePriceArray: { $objectToArray: "$sizePrice" },

                // Calculate lowest price from sizePrice
                lowestPrice: {
                    $min: {
                        $map: {
                            input: { $objectToArray: "$sizePrice" },
                            as: "item",
                            in: "$$item.v.price"
                        }
                    }
                },

                // Calculate highest price from sizePrice
                highestPrice: {
                    $max: {
                        $map: {
                            input: { $objectToArray: "$sizePrice" },
                            as: "item",
                            in: "$$item.v.price"
                        }
                    }
                },

                // Calculate total stock
                totalStock: {
                    $sum: {
                        $map: {
                            input: { $objectToArray: "$sizePrice" },
                            as: "item",
                            in: "$$item.v.stock"
                        }
                    }
                }
            }
        }
    ];

    // Lọc theo giá nếu có - UPDATED TO USE lowestPrice
    if (minPrice || maxPrice) {
        const priceConditions = {};
        if (minPrice) priceConditions.$gte = parseFloat(minPrice);
        if (maxPrice) priceConditions.$lte = parseFloat(maxPrice);

        pipeline.push({
            $match: {
                lowestPrice: priceConditions
            }
        });

        console.log('Price filter applied:', priceConditions);
    }

    // Sắp xếp - FIXED SORT CONDITIONS
    let sortCondition = {};

    // Handle different sort fields
    if (sortBy === 'lowestPrice' || sortBy === 'price') {
        sortCondition.lowestPrice = sortOrder === 'asc' ? 1 : -1;
        console.log('Sorting by lowest price:', sortCondition);
    } else if (sortBy === 'highestPrice') {
        sortCondition.highestPrice = sortOrder === 'asc' ? 1 : -1;
        console.log('Sorting by highest price:', sortCondition);
    } else if (sortBy === 'totalSold') {
        sortCondition.totalSold = sortOrder === 'asc' ? 1 : -1;
        console.log('Sorting by total sold:', sortCondition);
    } else if (sortBy === 'avgRating') {
        sortCondition.avgRating = sortOrder === 'asc' ? 1 : -1;
        console.log('Sorting by rating:', sortCondition);
    } else if (sortBy === 'nameProduct') {
        sortCondition.nameProduct = sortOrder === 'asc' ? 1 : -1;
        console.log('Sorting by name:', sortCondition);
    } else if (sortBy === 'category') {
        sortCondition.category = sortOrder === 'asc' ? 1 : -1;
        console.log('Sorting by category:', sortCondition);
    } else {
        // Default sort by createdAt
        sortCondition.createdAt = sortOrder === 'asc' ? 1 : -1;
        console.log('Sorting by created date:', sortCondition);
    }

    pipeline.push({ $sort: sortCondition });

    // Phân trang
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    console.log('🔄 Final aggregation pipeline:', JSON.stringify(pipeline, null, 2));

    const results = await this.aggregate(pipeline);

    console.log(`Found ${results.length} products`);

    // Log sample results for debugging
    if (results.length > 0) {
        console.log('🎯 Sample results:');
        results.slice(0, 3).forEach((product, index) => {
            console.log(`${index + 1}. ${product.nameProduct}: ${product.lowestPrice?.toLocaleString('vi-VN')}đ`);
        });
    }

    return results;
};

const Products = mongoose.model('Products', productsSchema);
module.exports = Products;