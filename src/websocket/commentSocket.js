// src/websocket/commentSocket.js
const socketIO = require('socket.io');
const Comment = require('../models/comment.model');

class CommentSocketServer {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT", "DELETE"],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        console.log('🌐 Comment WebSocket Server initialized');
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log('🔌 User connected to comment socket:', socket.id);

            // Join product room for real-time comments
            socket.on('join_product', (data) => {
                const { productId, userId, userName } = data;
                socket.join(`product_${productId}`);
                socket.productId = productId;
                socket.userId = userId;
                socket.userName = userName;

                console.log(`User ${userName} (${userId}) joined product room: ${productId}`);

                // Thông báo cho các user khác trong room
                socket.to(`product_${productId}`).emit('user_joined', {
                    userId: userId,
                    userName: userName,
                    timestamp: new Date().toISOString()
                });

                // Gửi số lượng user online trong room
                this.updateRoomUserCount(productId);
            });

            // Leave product room
            socket.on('leave_product', (productId) => {
                socket.leave(`product_${productId}`);
                console.log(`👋 User ${socket.userId} left product room: ${productId}`);

                socket.to(`product_${productId}`).emit('user_left', {
                    userId: socket.userId,
                    userName: socket.userName,
                    timestamp: new Date().toISOString()
                });

                this.updateRoomUserCount(productId);
                socket.productId = null;
            });

            // Handle new comment from client
            socket.on('send_comment', async (commentData) => {
                try {
                    console.log('📝 Received comment from client:', commentData);

                    // Validate comment data
                    if (!commentData.content || !commentData.idProduct || !commentData.idUser) {
                        socket.emit('comment_error', {
                            message: 'Thiếu thông tin comment bắt buộc'
                        });
                        return;
                    }

                    // Broadcast to all users in product room (except sender)
                    socket.to(`product_${commentData.idProduct}`).emit('new_comment', {
                        comment: commentData,
                        timestamp: new Date().toISOString(),
                        isRealtime: true
                    });

                    console.log(`Comment broadcast to product_${commentData.idProduct}`);

                    // Confirm to sender
                    socket.emit('comment_sent', {
                        success: true,
                        comment: commentData
                    });

                } catch (error) {
                    console.error('Error handling send_comment:', error);
                    socket.emit('comment_error', {
                        message: 'Lỗi khi gửi comment',
                        error: error.message
                    });
                }
            });

            // Handle comment like in realtime
            socket.on('toggle_like', (data) => {
                const { commentId, productId, likes, isLiked, userId } = data;

                socket.to(`product_${productId}`).emit('comment_like_updated', {
                    commentId: commentId,
                    likes: likes,
                    isLiked: isLiked,
                    userId: userId,
                    timestamp: new Date().toISOString()
                });

                console.log(`Like update broadcast for comment ${commentId}`);
            });

            // Handle comment reply in realtime
            socket.on('send_reply', (data) => {
                const { commentId, productId, reply } = data;

                socket.to(`product_${productId}`).emit('new_reply', {
                    commentId: commentId,
                    reply: reply,
                    timestamp: new Date().toISOString()
                });

                console.log(`Reply broadcast for comment ${commentId}`);
            });

            // Handle typing indicator
            socket.on('typing', (data) => {
                const { productId, userId, userName, isTyping } = data;

                socket.to(`product_${productId}`).emit('user_typing', {
                    userId: userId,
                    userName: userName,
                    isTyping: isTyping,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('🔌 User disconnected:', socket.id);

                if (socket.productId) {
                    socket.to(`product_${socket.productId}`).emit('user_left', {
                        userId: socket.userId,
                        userName: socket.userName,
                        timestamp: new Date().toISOString()
                    });

                    this.updateRoomUserCount(socket.productId);
                }
            });

            // Handle ping/pong for connection health
            socket.on('ping', () => {
                socket.emit('pong');
            });
        });
    }

    // Update user count in room
    async updateRoomUserCount(productId) {
        try {
            const room = this.io.sockets.adapter.rooms.get(`product_${productId}`);
            const userCount = room ? room.size : 0;

            this.io.to(`product_${productId}`).emit('room_user_count', {
                productId: productId,
                userCount: userCount,
                timestamp: new Date().toISOString()
            });

            console.log(`Product ${productId} has ${userCount} users online`);
        } catch (error) {
            console.error('Error updating room user count:', error);
        }
    }

    // Server-side methods to broadcast events
    broadcastNewComment(productId, comment) {
        try {
            this.io.to(`product_${productId}`).emit('comment_added_from_api', {
                comment: comment,
                timestamp: new Date().toISOString(),
                source: 'api'
            });

            console.log(`API Comment broadcast to product_${productId}`);
        } catch (error) {
            console.error('Error broadcasting comment:', error);
        }
    }

    broadcastLikeUpdate(productId, commentId, likes, isLiked, userId) {
        try {
            this.io.to(`product_${productId}`).emit('comment_like_updated_from_api', {
                commentId: commentId,
                likes: likes,
                isLiked: isLiked,
                userId: userId,
                timestamp: new Date().toISOString(),
                source: 'api'
            });

            console.log(`API Like update broadcast for comment ${commentId}`);
        } catch (error) {
            console.error('Error broadcasting like update:', error);
        }
    }

    broadcastReplyAdded(productId, commentId, reply) {
        try {
            this.io.to(`product_${productId}`).emit('reply_added_from_api', {
                commentId: commentId,
                reply: reply,
                timestamp: new Date().toISOString(),
                source: 'api'
            });

            console.log(`API Reply broadcast for comment ${commentId}`);
        } catch (error) {
            console.error('Error broadcasting reply:', error);
        }
    }

    // Get room statistics
    getRoomStats(productId) {
        try {
            const room = this.io.sockets.adapter.rooms.get(`product_${productId}`);
            return {
                productId: productId,
                userCount: room ? room.size : 0,
                users: room ? Array.from(room) : []
            };
        } catch (error) {
            console.error('Error getting room stats:', error);
            return { productId, userCount: 0, users: [] };
        }
    }
}

module.exports = CommentSocketServer;