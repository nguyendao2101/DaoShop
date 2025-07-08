// src/routes/comment.route.js
const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/comment.controller');

console.log('🚀 Comment routes loaded');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API quản lý bình luận sản phẩm
 */

/**
 * @swagger
 * /api/comments/product/{productId}:
 *   get:
 *     summary: Lấy danh sách comments theo sản phẩm
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *         example: BT1
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           minimum: 1
 *         description: Số trang
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *         description: Số comments mỗi trang
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [timeComment, likes]
 *         description: Sắp xếp theo
 *         example: timeComment
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *         example: desc
 *     responses:
 *       200:
 *         description: Danh sách comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentsResponse'
 *       404:
 *         description: Không tìm thấy sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Tạo comment mới
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Tạo comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tạo comment thành công
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Lấy comment theo ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID comment
 *     responses:
 *       200:
 *         description: Thông tin comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentResponse'
 *       404:
 *         description: Không tìm thấy comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Cập nhật comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCommentRequest'
 *     responses:
 *       200:
 *         description: Cập nhật comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật comment thành công
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Không có quyền hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Xóa comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: g5ddiB1d91etU1xWZXwlUQRokcG3
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Xóa comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Xóa comment thành công
 *       400:
 *         description: Không có quyền hoặc comment không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/comments/{id}/replies:
 *   post:
 *     summary: Thêm reply vào comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReplyRequest'
 *     responses:
 *       200:
 *         description: Thêm reply thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Thêm reply thành công
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/comments/{id}/like:
 *   post:
 *     summary: Like/Unlike comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: g5ddiB1d91etU1xWZXwlUQRokcG3
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Like/Unlike thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đã like comment
 *                 data:
 *                   type: object
 *                   properties:
 *                     isLiked:
 *                       type: boolean
 *                       example: true
 *                     totalLikes:
 *                       type: number
 *                       example: 5
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/comments/user/{userId}:
 *   get:
 *     summary: Lấy comments theo user
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID user
 *         example: g5ddiB1d91etU1xWZXwlUQRokcG3
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           minimum: 1
 *         description: Số trang
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *         description: Số comments mỗi trang
 *         example: 10
 *     responses:
 *       200:
 *         description: Danh sách comments của user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentsResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/comments/stats/{productId}:
 *   get:
 *     summary: Thống kê comments của sản phẩm
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *         example: BT1
 *     responses:
 *       200:
 *         description: Thống kê comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalComments:
 *                       type: number
 *                       example: 25
 *                     commentsWithReplies:
 *                       type: number
 *                       example: 10
 *                     totalLikes:
 *                       type: number
 *                       example: 45
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// WebSocket stats route
router.get('/websocket/stats/:productId', CommentController.getWebSocketStats);

// Routes
router.get('/product/:productId', CommentController.getCommentsByProduct);
router.get('/user/:userId', CommentController.getCommentsByUser);
router.get('/stats/:productId', CommentController.getCommentStats);

router.post('/', CommentController.createComment);
router.post('/:id/replies', CommentController.addReply);
router.post('/:id/like', CommentController.toggleLike);

router.put('/:id', CommentController.updateComment);
router.delete('/:id', CommentController.deleteComment);

module.exports = router;