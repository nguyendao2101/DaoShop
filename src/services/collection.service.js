// src/services/collection.service.js
const Collection = require('../models/collection.model');
const Products = require('../models/product.model');
// const { logger } = require('../config/logger'); // Comment tạm thời

class CollectionService {
    // Lấy tất cả collections
    static async getAllCollections(filters = {}) {
        try {
            console.log('🚀 CollectionService.getAllCollections called with filters:', filters);

            const collections = await Collection.searchCollections(filters);
            console.log('📦 Collections found:', collections.length);

            // Đếm tổng số collections cho pagination
            const countFilters = { ...filters };
            delete countFilters.page;
            delete countFilters.limit;
            delete countFilters.sortBy;
            delete countFilters.sortOrder;

            const matchConditions = {};

            if (countFilters.isActive !== undefined && countFilters.isActive !== null) {
                matchConditions.isActive = countFilters.isActive;
            }

            if (countFilters.keyword) {
                matchConditions.name = { $regex: countFilters.keyword, $options: 'i' };
            }

            const total = await Collection.countDocuments(matchConditions);
            console.log('🔢 Total count for pagination:', total);

            const result = {
                success: true,
                data: collections,
                pagination: {
                    total,
                    page: parseInt(filters.page) || 1,
                    limit: parseInt(filters.limit) || 10,
                    totalPages: Math.ceil(total / (parseInt(filters.limit) || 10))
                }
            };

            console.log('✅ Service result prepared successfully');
            return result;

        } catch (error) {
            console.error('❌ Error in CollectionService.getAllCollections:', error);
            throw new Error(`Lỗi khi lấy danh sách bộ sưu tập: ${error.message}`);
        }
    }

    // Lấy collection theo ID
    static async getCollectionById(collectionId) {
        try {
            console.log('🔍 Getting collection by ID:', collectionId);

            const collection = await Collection.findOne({
                idColection: collectionId
            });

            if (!collection) {
                throw new Error(`Không tìm thấy bộ sưu tập với ID: ${collectionId}`);
            }

            return {
                success: true,
                data: collection
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy bộ sưu tập: ${error.message}`);
        }
    }

    // Lấy products trong collection
    static async getProductsInCollection(collectionId, filters = {}) {
        try {
            const collection = await Collection.findOne({
                idColection: collectionId
            });

            if (!collection) {
                throw new Error(`Không tìm thấy bộ sưu tập với ID: ${collectionId}`);
            }

            const productIds = collection.getUniqueProductIds();
            console.log('Product IDs in collection:', productIds);

            // Lấy thông tin chi tiết các sản phẩm
            const products = await Products.find({
                id: { $in: productIds },
                show: 'true'
            });

            return {
                success: true,
                data: {
                    collection: {
                        idColection: collection.idColection,
                        name: collection.name,
                        urlImage: collection.urlImage,
                        description: collection.description,
                        totalProducts: collection.totalProducts
                    },
                    products: products
                }
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy sản phẩm trong bộ sưu tập: ${error.message}`);
        }
    }

    // Tạo collection mới
    static async createCollection(collectionData) {
        try {
            console.log('📝 Creating collection with data:', collectionData);

            // Kiểm tra ID đã tồn tại chưa
            const existingCollection = await Collection.findOne({
                idColection: collectionData.idColection
            });

            if (existingCollection) {
                throw new Error(`Bộ sưu tập với ID ${collectionData.idColection} đã tồn tại`);
            }

            const collection = new Collection(collectionData);
            await collection.save();

            return {
                success: true,
                message: 'Tạo bộ sưu tập thành công',
                data: collection
            };
        } catch (error) {
            console.error('❌ Error creating collection:', error);
            throw new Error(`Lỗi khi tạo bộ sưu tập: ${error.message}`);
        }
    }

    // Cập nhật collection
    static async updateCollection(collectionId, updateData) {
        try {
            const collection = await Collection.findOne({ idColection: collectionId });

            if (!collection) {
                throw new Error(`Không tìm thấy bộ sưu tập với ID: ${collectionId}`);
            }

            // Cập nhật các trường
            Object.keys(updateData).forEach(key => {
                if (key !== 'idColection') { // Không cho phép thay đổi ID
                    collection[key] = updateData[key];
                }
            });

            await collection.save();

            return {
                success: true,
                message: 'Cập nhật bộ sưu tập thành công',
                data: collection
            };
        } catch (error) {
            throw new Error(`Lỗi khi cập nhật bộ sưu tập: ${error.message}`);
        }
    }

    // Xóa collection (soft delete)
    static async deleteCollection(collectionId) {
        try {
            const collection = await Collection.findOne({ idColection: collectionId });

            if (!collection) {
                throw new Error(`Không tìm thấy bộ sưu tập với ID: ${collectionId}`);
            }

            collection.isActive = false;
            await collection.save();

            return {
                success: true,
                message: 'Xóa bộ sưu tập thành công'
            };
        } catch (error) {
            throw new Error(`Lỗi khi xóa bộ sưu tập: ${error.message}`);
        }
    }

    // Thêm sản phẩm vào collection
    static async addProductToCollection(collectionId, productId) {
        try {
            const collection = await Collection.findOne({ idColection: collectionId });

            if (!collection) {
                throw new Error(`Không tìm thấy bộ sưu tập với ID: ${collectionId}`);
            }

            // Kiểm tra sản phẩm có tồn tại không
            const product = await Products.findOne({ id: productId });

            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
            }

            // Kiểm tra sản phẩm đã có trong collection chưa
            if (collection.hasProduct(productId)) {
                throw new Error(`Sản phẩm ${productId} đã có trong bộ sưu tập`);
            }

            // Thêm sản phẩm
            collection.addProduct(productId);
            await collection.save();

            return {
                success: true,
                message: 'Thêm sản phẩm vào bộ sưu tập thành công',
                data: collection
            };
        } catch (error) {
            throw new Error(`Lỗi khi thêm sản phẩm vào bộ sưu tập: ${error.message}`);
        }
    }

    // Xóa sản phẩm khỏi collection
    static async removeProductFromCollection(collectionId, productId) {
        try {
            const collection = await Collection.findOne({ idColection: collectionId });

            if (!collection) {
                throw new Error(`Không tìm thấy bộ sưu tập với ID: ${collectionId}`);
            }

            // Kiểm tra sản phẩm có trong collection không
            if (!collection.hasProduct(productId)) {
                throw new Error(`Sản phẩm ${productId} không có trong bộ sưu tập`);
            }

            // Xóa sản phẩm
            collection.removeProduct(productId);
            await collection.save();

            return {
                success: true,
                message: 'Xóa sản phẩm khỏi bộ sưu tập thành công',
                data: collection
            };
        } catch (error) {
            throw new Error(`Lỗi khi xóa sản phẩm khỏi bộ sưu tập: ${error.message}`);
        }
    }

    // Lấy bộ sưu tập phổ biến
    static async getPopularCollections(limit = 10) {
        try {
            const collections = await Collection.getPopularCollections(parseInt(limit));
            return collections;
        } catch (error) {
            throw new Error(`Lỗi khi lấy bộ sưu tập phổ biến: ${error.message}`);
        }
    }

    // Debug info
    static async getDebugInfo() {
        try {
            const totalCount = await Collection.countDocuments({});
            const activeCount = await Collection.countDocuments({ isActive: true });
            const inactiveCount = await Collection.countDocuments({ isActive: false });

            // Lấy 5 collections đầu tiên để xem cấu trúc
            const sampleCollections = await Collection.find({}).limit(5);

            return {
                totalCount,
                activeCount,
                inactiveCount,
                sampleCollections
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy debug info: ${error.message}`);
        }
    }
}

module.exports = CollectionService;