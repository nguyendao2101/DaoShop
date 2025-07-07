// src/services/products.service.js
const Products = require('../models/product.model');
const { logger } = require('../config/logger');


class ProductsService {
    // Lấy tất cả sản phẩm với bộ lọc
    static async getAllProducts(filters = {}) {
        try {
            const products = await Products.searchProducts(filters);

            // Đếm tổng số sản phẩm (không phân trang)
            const countFilters = { ...filters };
            delete countFilters.page;
            delete countFilters.limit;
            delete countFilters.sortBy;
            delete countFilters.sortOrder;

            const totalProducts = await Products.searchProducts({
                ...countFilters,
                page: 1,
                limit: 999999
            });

            return {
                success: true,
                data: products,
                pagination: {
                    total: totalProducts.length,
                    page: parseInt(filters.page) || 1,
                    limit: parseInt(filters.limit) || 10,
                    totalPages: Math.ceil(totalProducts.length / (parseInt(filters.limit) || 10))
                }
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách sản phẩm: ${error.message}`);
        }
    }

    // Lấy sản phẩm theo ID
    static async getProductById(productId) {
        try {
            const product = await Products.findOne({ id: productId, show: 'true' });

            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
            }

            return {
                success: true,
                data: product
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy sản phẩm: ${error.message}`);
        }
    }

    // Tạo sản phẩm mới
    static async createProduct(productData) {
        try {
            // Kiểm tra xem sản phẩm đã tồn tại chưa
            const existingProduct = await Products.findOne({ id: productData.id });
            if (existingProduct) {
                throw new Error(`Sản phẩm với ID ${productData.id} đã tồn tại`);
            }

            const product = new Products(productData);
            await product.save();

            return {
                success: true,
                message: 'Tạo sản phẩm thành công',
                data: product
            };
        } catch (error) {
            throw new Error(`Lỗi khi tạo sản phẩm: ${error.message}`);
        }
    }

    // Cập nhật sản phẩm
    static async updateProduct(productId, updateData) {
        try {
            const product = await Products.findOne({ id: productId });

            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
            }

            // Cập nhật các trường
            Object.keys(updateData).forEach(key => {
                if (key !== 'id') { // Không cho phép thay đổi ID
                    product[key] = updateData[key];
                }
            });

            await product.save();

            return {
                success: true,
                message: 'Cập nhật sản phẩm thành công',
                data: product
            };
        } catch (error) {
            throw new Error(`Lỗi khi cập nhật sản phẩm: ${error.message}`);
        }
    }

    // Xóa sản phẩm (ẩn đi)
    static async deleteProduct(productId) {
        try {
            const product = await Products.findOne({ id: productId });

            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
            }

            product.show = 'false';
            await product.save();

            return {
                success: true,
                message: 'Ẩn sản phẩm thành công'
            };
        } catch (error) {
            throw new Error(`Lỗi khi ẩn sản phẩm: ${error.message}`);
        }
    }

    // Lấy danh sách danh mục
    static async getCategories() {
        try {
            const categories = await Products.distinct('category', { show: 'true' });
            return {
                success: true,
                data: categories
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách danh mục: ${error.message}`);
        }
    }

    // Lấy danh sách loại sản phẩm theo danh mục
    static async getTypesByCategory(category) {
        try {
            const types = await Products.distinct('type', {
                category: category.toUpperCase(),
                show: 'true'
            });
            return {
                success: true,
                data: types
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách loại sản phẩm: ${error.message}`);
        }
    }

    // Cập nhật số lượng tồn kho
    static async updateStock(productId, sizeIndex, newStock) {
        try {
            const product = await Products.findOne({ id: productId });

            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
            }

            // Xử lý Map đúng cách
            let sizePriceObj;
            if (product.sizePrice instanceof Map) {
                sizePriceObj = Object.fromEntries(product.sizePrice);
            } else {
                sizePriceObj = product.sizePrice;
            }
            // Kiểm tra key tồn tại
            if (!sizePriceObj.hasOwnProperty(sizeIndex)) {
                throw new Error(`Không tìm thấy size với index: ${sizeIndex}. Available keys: ${Object.keys(sizePriceObj).join(', ')}`);
            }

            // Lấy dữ liệu hiện tại
            const currentSizePrice = sizePriceObj[sizeIndex];
            logger.info('Current sizePrice:', currentSizePrice);

            // Tạo object mới với stock được cập nhật
            const updatedSizePrice = {
                size: currentSizePrice.size,
                price: currentSizePrice.price,
                stock: parseInt(newStock) // Đảm bảo là số nguyên
            };

            logger.info('Updated sizePrice:', updatedSizePrice);

            // Cách 1: Sử dụng findOneAndUpdate với $set
            const updatedProduct = await Products.findOneAndUpdate(
                { id: productId },
                {
                    $set: {
                        [`sizePrice.${sizeIndex}`]: updatedSizePrice
                    }
                },
                {
                    new: true, // Trả về document sau khi update
                    runValidators: true
                }
            );

            logger.info('Product updated successfully');
            logger.info('New sizePrice in DB:', updatedProduct.sizePrice);

            return {
                success: true,
                message: 'Cập nhật tồn kho thành công',
                data: updatedProduct
            };

        } catch (error) {
            logger.error('Error updating stock:', error);
            throw new Error(`Lỗi khi cập nhật tồn kho: ${error.message}`);
        }
    }

}

module.exports = ProductsService;