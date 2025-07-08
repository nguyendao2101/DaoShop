// src/controllers/comment.controller.js
const CommentService = require('../services/comment.service');

class CommentController {
    static setWebSocket(wsInstance) {
        this.webSocket = wsInstance;
        CommentService.setWebSocket(wsInstance);
    }
    // GET /api/comments/product/:productId - Lấy comments theo sản phẩm
    static async getCommentsByProduct(req, res) {
        try {
            const { productId } = req.params;
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sortBy: req.query.sortBy || 'timeComment',
                sortOrder: req.query.sortOrder || 'desc'
            };

            console.log('🎯 Controller - productId:', productId);
            console.log('🎯 Controller - filters:', filters);

            const result = await CommentService.getCommentsByProduct(productId, filters);
            return res.status(200).json(result);
        } catch (error) {
            console.error('❌ Error in getCommentsByProduct:', error);
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // DEBUG: Kiểm tra comments trong database
    static async debugComments(req, res) {
        try {
            console.log('🐛 Debug comments called');

            const debugInfo = await CommentService.getDebugInfo();

            return res.status(200).json({
                success: true,
                debug: debugInfo
            });
        } catch (error) {
            console.error('❌ Debug error:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Tạo comment test - KHÔNG kiểm tra product tồn tại
    static async createTestComment(req, res) {
        try {
            const productId = req.query.productId || 'BT1';
            console.log('🧪 Creating test comment for product:', productId);

            const result = await CommentService.createTestComment(productId);
            return res.status(201).json(result);
        } catch (error) {
            console.error('❌ Error creating test comment:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/comments/:id - Lấy comment theo ID
    static async getCommentById(req, res) {
        try {
            const { id } = req.params;
            const result = await CommentService.getCommentById(id);
            return res.status(200).json(result);
        } catch (error) {
            console.error('❌ Error in getCommentById:', error);
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/comments - Tạo comment mới
    static async createComment(req, res) {
        try {
            const commentData = req.body;

            // Validation
            if (!commentData.content || !commentData.idProduct || !commentData.idUser || !commentData.nameUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: content, idProduct, idUser, nameUser'
                });
            }

            const result = await CommentService.createComment(commentData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('❌ Error in createComment:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Placeholder methods for other routes
    static async getCommentsByUser(req, res) {
        try {
            const { userId } = req.params;
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };

            console.log('🎯 Controller - userId:', userId);
            console.log('🎯 Controller - user filters:', filters);

            const result = await CommentService.getCommentsByUser(userId, filters);
            return res.status(200).json(result);
        } catch (error) {
            console.error('❌ Error in getCommentsByUser:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    static async updateComment(req, res) {
        try {
            console.log('✏️ Update comment called');
            return res.status(501).json({
                success: false,
                message: 'Update comment not implemented yet'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async deleteComment(req, res) {
        try {
            console.log('🗑️ Delete comment called');
            return res.status(501).json({
                success: false,
                message: 'Delete comment not implemented yet'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async addReply(req, res) {
        try {
            console.log('💬 Add reply called');
            return res.status(501).json({
                success: false,
                message: 'Add reply not implemented yet'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async toggleLike(req, res) {
        try {
            console.log('👍 Toggle like called');
            return res.status(501).json({
                success: false,
                message: 'Toggle like not implemented yet'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getCommentStats(req, res) {
        try {
            console.log('📊 Get comment stats called');
            return res.status(501).json({
                success: false,
                message: 'Get comment stats not implemented yet'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    // POST /api/comments - Tạo comment mới với WebSocket
    static async createComment(req, res) {
        try {
            const commentData = req.body;

            // Validation
            if (!commentData.content || !commentData.idProduct || !commentData.idUser || !commentData.nameUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: content, idProduct, idUser, nameUser'
                });
            }

            const result = await CommentService.createComment(commentData);
            return res.status(201).json(result);
        } catch (error) {
            console.error('❌ Error in createComment:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/comments/:id/like - Toggle like với WebSocket
    static async toggleLike(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu userId'
                });
            }

            const result = await CommentService.toggleLike(id, userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error('❌ Error in toggleLike:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /api/comments/:id/replies - Thêm reply với WebSocket
    static async addReply(req, res) {
        try {
            const { id } = req.params;
            const replyData = req.body;

            if (!replyData.content || !replyData.userId || !replyData.userName) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin: content, userId, userName'
                });
            }

            const result = await CommentService.addReply(id, replyData);
            return res.status(200).json(result);
        } catch (error) {
            console.error('❌ Error in addReply:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /api/comments/websocket/stats/:productId - WebSocket room stats
    static async getWebSocketStats(req, res) {
        try {
            const { productId } = req.params;

            if (this.webSocket) {
                const stats = this.webSocket.getRoomStats(productId);
                return res.status(200).json({
                    success: true,
                    data: stats
                });
            } else {
                return res.status(503).json({
                    success: false,
                    message: 'WebSocket service not available'
                });
            }
        } catch (error) {
            console.error('❌ Error in getWebSocketStats:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = CommentController;