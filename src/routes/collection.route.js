// src/routes/collection.route.js
const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/collection.controller');

console.log('🚀 Collection routes loaded'); // Debug log

/**
 * @swagger
 * tags:
 *   name: Collections
 *   description: API quản lý bộ sưu tập sản phẩm
 */

/**
 * @swagger
 * /api/collections/debug/info:
 *   get:
 *     summary: Debug - Thông tin collections trong database
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: Thông tin debug về collections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 debug:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: number
 *                       example: 1
 *                     activeCount:
 *                       type: number
 *                       example: 1
 *                     inactiveCount:
 *                       type: number
 *                       example: 0
 *                     sampleCollections:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Collection'
 */

/**
 * @swagger
 * /api/collections/popular:
 *   get:
 *     summary: Lấy danh sách bộ sưu tập phổ biến
 *     tags: [Collections]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 50
 *         description: Số lượng bộ sưu tập
 *         example: 10
 *     responses:
 *       200:
 *         description: Danh sách bộ sưu tập phổ biến
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collection'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/collections:
 *   get:
 *     summary: Lấy danh sách bộ sưu tập
 *     tags: [Collections]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên
 *         example: Chót mê
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [displayOrder, name, createdAt, totalProducts]
 *         description: Sắp xếp theo trường
 *         example: displayOrder
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *         example: asc
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
 *         description: Số bộ sưu tập mỗi trang
 *         example: 10
 *     responses:
 *       200:
 *         description: Danh sách bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollectionsResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Tạo bộ sưu tập mới (Admin)
 *     tags: [Collections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCollectionRequest'
 *     responses:
 *       201:
 *         description: Tạo bộ sưu tập thành công
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
 *                   example: Tạo bộ sưu tập thành công
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc bộ sưu tập đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/collections/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết bộ sưu tập
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bộ sưu tập
 *         example: Chót Mê
 *     responses:
 *       200:
 *         description: Thông tin bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollectionResponse'
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Cập nhật thông tin bộ sưu tập (Admin)
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bộ sưu tập
 *         example: Chót Mê
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCollectionRequest'
 *     responses:
 *       200:
 *         description: Cập nhật bộ sưu tập thành công
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
 *                   example: Cập nhật bộ sưu tập thành công
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Xóa bộ sưu tập (Admin)
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bộ sưu tập
 *         example: Chót Mê
 *     responses:
 *       200:
 *         description: Xóa bộ sưu tập thành công
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
 *                   example: Xóa bộ sưu tập thành công
 *       400:
 *         description: Bộ sưu tập không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/collections/{id}/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm trong bộ sưu tập
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bộ sưu tập
 *         example: Chót Mê
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
 *         description: Số sản phẩm mỗi trang
 *         example: 10
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm trong bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollectionProductsResponse'
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Thêm sản phẩm vào bộ sưu tập (Admin)
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bộ sưu tập
 *         example: Chót Mê
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddProductRequest'
 *     responses:
 *       200:
 *         description: Thêm sản phẩm vào bộ sưu tập thành công
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
 *                   example: Thêm sản phẩm vào bộ sưu tập thành công
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc sản phẩm đã có trong bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy bộ sưu tập hoặc sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/collections/{id}/products/{productId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi bộ sưu tập (Admin)
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bộ sưu tập
 *         example: Chót Mê
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm
 *         example: BT1
 *     responses:
 *       200:
 *         description: Xóa sản phẩm khỏi bộ sưu tập thành công
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
 *                   example: Xóa sản phẩm khỏi bộ sưu tập thành công
 *                 data:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Sản phẩm không có trong bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy bộ sưu tập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Debug route - đặt ở đầu để tránh conflict với /:id
router.get('/debug/info', CollectionController.debugCollections);

// Routes phổ biến - đặt trước /:id để tránh conflict
router.get('/popular', CollectionController.getPopularCollections);

// Routes chính
router.get('/', CollectionController.getAllCollections);
router.get('/:id', CollectionController.getCollectionById);
router.get('/:id/products', CollectionController.getProductsInCollection);

// Admin routes
router.post('/', CollectionController.createCollection);
router.put('/:id', CollectionController.updateCollection);
router.delete('/:id', CollectionController.deleteCollection);
router.post('/:id/products', CollectionController.addProductToCollection);
router.delete('/:id/products/:productId', CollectionController.removeProductFromCollection);

console.log('✅ Collection routes configured with full Swagger documentation');

module.exports = router;