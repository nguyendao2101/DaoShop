// src/services/comment.service.js
const Comment = require('../models/comment.model');
const Product = require('../models/product.model'); // Sửa từ Products thành Product

class CommentService {
    // Lấy comments theo sản phẩm
    static setWebSocket(wsInstance) {
        this.webSocket = wsInstance;
    }
    static async getCommentsByProduct(productId, filters = {}) {
        try {
            console.log('Getting comments for product:', productId);
            console.log('Filters:', filters);

            // Kiểm tra sản phẩm có tồn tại không - Sửa từ Products thành Product
            const product = await Product.findOne({ id: productId });
            console.log('Product found:', product ? 'Yes' : 'No');

            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${productId}`);
            }

            // Kiểm tra tổng số comments trước
            const totalComments = await Comment.countDocuments({ idProduct: productId });
            const activeComments = await Comment.countDocuments({ idProduct: productId, isActive: true });
            console.log('Total comments in DB:', totalComments);
            console.log('Active comments in DB:', activeComments);

            // Lấy một vài comments mẫu để debug
            const sampleComments = await Comment.find({ idProduct: productId }).limit(3);
            console.log('Sample comments:', sampleComments);

            const comments = await Comment.getCommentsByProduct(productId, filters);
            console.log('Comments returned from static method:', comments.length);

            // Đếm tổng số comments cho pagination
            const total = await Comment.countDocuments({
                idProduct: productId,
                isActive: true
            });

            console.log('📈 Final pagination total:', total);

            return {
                success: true,
                data: comments,
                pagination: {
                    total,
                    page: parseInt(filters.page) || 1,
                    limit: parseInt(filters.limit) || 10,
                    totalPages: Math.ceil(total / (parseInt(filters.limit) || 10))
                }
            };
        } catch (error) {
            console.error('Error in getCommentsByProduct:', error);
            throw new Error(`Lỗi khi lấy comments: ${error.message}`);
        }
    }

    // Tạo comment mới
    static async createComment(commentData) {
        try {
            console.log('Creating comment:', commentData);

            // Kiểm tra sản phẩm có tồn tại không - Sửa từ Products thành Product
            const product = await Product.findOne({ id: commentData.idProduct });
            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${commentData.idProduct}`);
            }

            // Tạo timeComment
            const timeComment = new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });

            const comment = new Comment({
                ...commentData,
                timeComment,
                hasFix: 'false',
                isActive: true
            });

            await comment.save();

            return {
                success: true,
                message: 'Tạo comment thành công',
                data: comment
            };
        } catch (error) {
            throw new Error(`Lỗi khi tạo comment: ${error.message}`);
        }
    }

    // Thêm method tạo comment test không cần kiểm tra product
    static async createTestComment(productId) {
        try {
            const testComment = new Comment({
                content: 'Đây là comment test để kiểm tra API',
                idProduct: productId,
                idUser: 'test-user-id',
                nameUser: 'Test User',
                timeComment: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                }),
                hasFix: 'false',
                isActive: true,
                likes: 0,
                likedBy: [],
                replies: []
            });

            await testComment.save();

            return {
                success: true,
                message: 'Tạo test comment thành công',
                data: testComment
            };
        } catch (error) {
            throw new Error(`Lỗi khi tạo test comment: ${error.message}`);
        }
    }

    // Debug info
    static async getDebugInfo() {
        try {
            const totalCount = await Comment.countDocuments({});
            const activeCount = await Comment.countDocuments({ isActive: true });
            const inactiveCount = await Comment.countDocuments({ isActive: false });

            // Lấy 5 comments đầu tiên để xem cấu trúc
            const sampleComments = await Comment.find({}).limit(5);

            // Lấy comments theo sản phẩm BT1
            const bt1Comments = await Comment.find({ idProduct: 'BT1' });

            return {
                totalCount,
                activeCount,
                inactiveCount,
                sampleComments,
                bt1Comments
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy debug info: ${error.message}`);
        }
    }

    // Các methods khác giữ nguyên...
    static async getCommentsByUser(userId, filters = {}) {
        try {
            console.log('Getting comments for user:', userId);
            console.log('User filters:', filters);

            const {
                page = 1,
                limit = 10
            } = filters;

            // Kiểm tra tổng số comments của user trước
            const totalComments = await Comment.countDocuments({ idUser: userId });
            const activeComments = await Comment.countDocuments({ idUser: userId, isActive: true });
            console.log('Total user comments in DB:', totalComments);
            console.log('Active user comments in DB:', activeComments);

            // Lấy một vài comments mẫu để debug
            const sampleComments = await Comment.find({ idUser: userId }).limit(3);
            console.log('Sample user comments:', sampleComments);

            const comments = await Comment.getCommentsByUser(userId, filters);
            console.log('User comments returned from static method:', comments.length);

            // Đếm tổng số comments cho pagination
            const total = await Comment.countDocuments({
                idUser: userId,
                isActive: true
            });

            console.log('Final user pagination total:', total);

            return {
                success: true,
                data: comments,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            };
        } catch (error) {
            console.error('Error in getCommentsByUser:', error);
            throw new Error(`Lỗi khi lấy comments của user: ${error.message}`);
        }
    }
    // Tạo comment mới với WebSocket broadcast
    static async createComment(commentData) {
        try {
            console.log('Creating comment:', commentData);

            // Kiểm tra sản phẩm có tồn tại không
            const product = await Product.findOne({ id: commentData.idProduct });
            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID: ${commentData.idProduct}`);
            }

            // Tạo timeComment
            const timeComment = new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });

            const comment = new Comment({
                ...commentData,
                timeComment,
                hasFix: 'false',
                isActive: true
            });

            await comment.save();

            // Broadcast to WebSocket clients
            if (this.webSocket) {
                this.webSocket.broadcastNewComment(commentData.idProduct, comment.toObject());
            }

            return {
                success: true,
                message: 'Tạo comment thành công',
                data: comment
            };
        } catch (error) {
            throw new Error(`Lỗi khi tạo comment: ${error.message}`);
        }
    }

    // Thêm method like với WebSocket
    static async toggleLike(commentId, userId) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw new Error('Không tìm thấy comment');
            }

            const likedIndex = comment.likedBy.indexOf(userId);
            let isLiked;

            if (likedIndex > -1) {
                // Unlike
                comment.likedBy.splice(likedIndex, 1);
                comment.likes = Math.max(0, comment.likes - 1);
                isLiked = false;
            } else {
                // Like
                comment.likedBy.push(userId);
                comment.likes += 1;
                isLiked = true;
            }

            await comment.save();

            // Broadcast like update via WebSocket
            if (this.webSocket) {
                this.webSocket.broadcastLikeUpdate(
                    comment.idProduct,
                    commentId,
                    comment.likes,
                    isLiked,
                    userId
                );
            }

            return {
                success: true,
                message: isLiked ? 'Đã like comment' : 'Đã unlike comment',
                data: {
                    isLiked,
                    totalLikes: comment.likes
                }
            };
        } catch (error) {
            throw new Error(`Lỗi khi like comment: ${error.message}`);
        }
    }

    // Thêm method reply với WebSocket
    static async addReply(commentId, replyData) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw new Error('Không tìm thấy comment');
            }

            const reply = {
                content: replyData.content,
                userId: replyData.userId,
                userName: replyData.userName,
                timeReply: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                }),
                isActive: true
            };

            comment.replies.push(reply);
            await comment.save();

            // Broadcast reply via WebSocket
            if (this.webSocket) {
                this.webSocket.broadcastReplyAdded(
                    comment.idProduct,
                    commentId,
                    reply
                );
            }

            return {
                success: true,
                message: 'Thêm reply thành công',
                data: comment
            };
        } catch (error) {
            throw new Error(`Lỗi khi thêm reply: ${error.message}`);
        }
    }

}

module.exports = CommentService;