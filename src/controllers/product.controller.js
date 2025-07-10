// src/controllers/product.controller.js
const ProductsService = require('../services/product.service');

class ProductsController {
    // GET /api/products - Lấy danh sách sản phẩm
    static async getAllProducts(req, res) {
        try {
            console.log('ProductController.getAllProducts query:', req.query);

            const filters = {
                // Basic filters
                category: req.query.category,
                type: req.query.type,
                gender: req.query.gender,
                material: req.query.material,
                karat: req.query.karat,

                // ADDED MISSING PRICE FILTERS
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,

                keyword: req.query.keyword,

                // Sort parameters
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',

                // Pagination
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,

                // Visibility
                onlyVisible: req.query.onlyVisible !== 'false'
            };

            // Log filters for debugging
            console.log('Filters sent to service:', filters);

            // Log specific price filters
            if (filters.minPrice || filters.maxPrice) {
                console.log('Price filters:', {
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice
                });
            }

            // Log sort parameters
            console.log('Sort parameters:', {
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            });

            const result = await ProductsService.getAllProducts(filters);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getAllProducts:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    // GET /api/products/:id - Lấy sản phẩm theo ID
    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const result = await ProductsService.getProductById(id);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/products - Tạo sản phẩm mới (Admin)
    static async createProduct(req, res) {
        try {
            const productData = req.body;
            const result = await ProductsService.createProduct(productData);

            return res.status(201).json(result);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // PUT /api/products/:id - Cập nhật sản phẩm (Admin)
    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const result = await ProductsService.updateProduct(id, updateData);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /api/products/:id - Xóa sản phẩm (Admin)
    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const result = await ProductsService.deleteProduct(id);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/products/categories - Lấy danh sách danh mục
    static async getCategories(req, res) {
        try {
            const result = await ProductsService.getCategories();

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/products/categories/:category/types - Lấy loại sản phẩm theo danh mục
    static async getTypesByCategory(req, res) {
        try {
            const { category } = req.params;
            const result = await ProductsService.getTypesByCategory(category);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // PATCH /api/products/:id/stock - Cập nhật tồn kho (Admin)
    static async updateStock(req, res) {
        try {
            const { id } = req.params;
            const { sizeIndex, stock } = req.body;

            if (sizeIndex === undefined || stock === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin sizeIndex hoặc stock'
                });
            }

            const result = await ProductsService.updateStock(id, sizeIndex, stock);

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = ProductsController;