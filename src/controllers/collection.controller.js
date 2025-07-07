// src/controllers/collection.controller.js
const CollectionService = require('../services/collection.service');
const { logger } = require('../config/logger');

class CollectionController {
    // GET /api/collections - Lấy danh sách bộ sưu tập
    static async getAllCollections(req, res) {
        try {
            const filters = {
                keyword: req.query.keyword,
                isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
                sortBy: req.query.sortBy || 'displayOrder',
                sortOrder: req.query.sortOrder || 'asc',
                page: req.query.page || 1,
                limit: req.query.limit || 10
            };

            logger.info('Controller filters:', filters);

            const result = await CollectionService.getAllCollections(filters);

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in getAllCollections:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/collections/:id - Lấy bộ sưu tập theo ID
    static async getCollectionById(req, res) {
        try {
            const { id } = req.params;
            const result = await CollectionService.getCollectionById(id);

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in getCollectionById:', error);
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/collections/:id/products - Lấy sản phẩm trong bộ sưu tập
    static async getProductsInCollection(req, res) {
        try {
            const { id } = req.params;
            const filters = {
                page: req.query.page || 1,
                limit: req.query.limit || 10
            };

            const result = await CollectionService.getProductsInCollection(id, filters);

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in getProductsInCollection:', error);
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/collections - Tạo bộ sưu tập mới (Admin)
    static async createCollection(req, res) {
        try {
            const collectionData = req.body;

            // Validation cơ bản
            if (!collectionData.idColection || !collectionData.name || !collectionData.urlImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: idColection, name, urlImage'
                });
            }

            const result = await CollectionService.createCollection(collectionData);

            return res.status(201).json(result);
        } catch (error) {
            logger.error('Error in createCollection:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // PUT /api/collections/:id - Cập nhật bộ sưu tập (Admin)
    static async updateCollection(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const result = await CollectionService.updateCollection(id, updateData);

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in updateCollection:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /api/collections/:id - Xóa bộ sưu tập (Admin)
    static async deleteCollection(req, res) {
        try {
            const { id } = req.params;
            const result = await CollectionService.deleteCollection(id);

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in deleteCollection:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/collections/:id/products - Thêm sản phẩm vào bộ sưu tập (Admin)
    static async addProductToCollection(req, res) {
        try {
            const { id } = req.params;
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu productId'
                });
            }

            const result = await CollectionService.addProductToCollection(id, productId);

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in addProductToCollection:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // DELETE /api/collections/:id/products/:productId - Xóa sản phẩm khỏi bộ sưu tập (Admin)
    static async removeProductFromCollection(req, res) {
        try {
            const { id, productId } = req.params;
            const result = await CollectionService.removeProductFromCollection(id, productId);

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in removeProductFromCollection:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/collections/popular - Lấy bộ sưu tập phổ biến
    static async getPopularCollections(req, res) {
        try {
            const limit = req.query.limit || 10;
            const result = await CollectionService.getPopularCollections(limit);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error in getPopularCollections:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // DEBUG: Kiểm tra tổng số collections trong DB
    static async debugCollections(req, res) {
        try {
            const debugInfo = await CollectionService.getDebugInfo();

            return res.status(200).json({
                success: true,
                debug: debugInfo
            });
        } catch (error) {
            logger.error('Debug error:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = CollectionController;