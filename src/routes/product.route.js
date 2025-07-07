// src/routes/product.route.js
const express = require('express');
const router = express.Router();
const ProductsController = require('../controllers/product.controller');
const { cache } = require('../middlewares/cacheMiddleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API quản lý sản phẩm
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *         example: TRANG SỨC
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Lọc theo loại sản phẩm
 *         example: Bông tai
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Nam, Nữ, Unisex]
 *         description: Lọc theo giới tính
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *         description: Lọc theo chất liệu
 *         example: Vàng
 *       - in: query
 *         name: karat
 *         schema:
 *           type: string
 *         description: Lọc theo độ tinh khiết
 *         example: 10K
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Giá tối thiểu
 *         example: 1000000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Giá tối đa
 *         example: 10000000
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *         example: bông tai
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, nameProduct, avgRating]
 *         description: Sắp xếp theo trường
 *         example: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp
 *         example: desc
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
 *       - in: query
 *         name: onlyVisible
 *         schema:
 *           type: boolean
 *         description: Chỉ lấy sản phẩm hiển thị
 *         example: true
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsResponse'
 *         headers:
 *           X-Cache:
 *             description: Cache status (HIT/MISS)
 *             schema:
 *               type: string
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã sản phẩm
 *         example: BT1
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *         headers:
 *           X-Cache:
 *             description: Cache status (HIT/MISS)
 *             schema:
 *               type: string
 *       404:
 *         description: Không tìm thấy sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Lấy danh sách danh mục sản phẩm
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriesResponse'
 *         headers:
 *           X-Cache:
 *             description: Cache status (HIT/MISS)
 *             schema:
 *               type: string
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products/categories/{category}/types:
 *   get:
 *     summary: Lấy danh sách loại sản phẩm theo danh mục
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên danh mục
 *         example: TRANG SỨC
 *     responses:
 *       200:
 *         description: Danh sách loại sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriesResponse'
 *         headers:
 *           X-Cache:
 *             description: Cache status (HIT/MISS)
 *             schema:
 *               type: string
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo sản phẩm mới (Admin)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
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
 *                   example: Tạo sản phẩm thành công
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc sản phẩm đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm (Admin)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã sản phẩm
 *         example: BT1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameProduct:
 *                 type: string
 *                 example: Bông tai Vàng 10K đính đá ECZ PNJ Updated
 *               description:
 *                 type: string
 *                 example: Mô tả đã được cập nhật
 *               discountPercent:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
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
 *                   example: Cập nhật sản phẩm thành công
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc sản phẩm không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Ẩn sản phẩm (Admin)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã sản phẩm
 *         example: BT1
 *     responses:
 *       200:
 *         description: Ẩn sản phẩm thành công
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
 *                   example: Ẩn sản phẩm thành công
 *       400:
 *         description: Sản phẩm không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Cập nhật tồn kho sản phẩm (Admin)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã sản phẩm
 *         example: BT1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStockRequest'
 *     responses:
 *       200:
 *         description: Cập nhật tồn kho thành công
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
 *                   example: Cập nhật tồn kho thành công
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc sản phẩm không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Routes công khai (không cần authentication)
router.get('/categories', cache(30 * 60), ProductsController.getCategories); // Cache 30 minutes
router.get('/categories/:category/types', cache(30 * 60), ProductsController.getTypesByCategory);
router.get('/', cache(5 * 60), ProductsController.getAllProducts); // Cache 5 minutes
router.get('/:id', cache(10 * 60), ProductsController.getProductById); // Cache 10 minutes

// Routes Admin (cần authentication & authorization)
// Uncomment khi đã có middleware authentication
// const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
// router.post('/', isAuthenticated, isAdmin, ProductsController.createProduct);
// router.put('/:id', isAuthenticated, isAdmin, ProductsController.updateProduct);
// router.delete('/:id', isAuthenticated, isAdmin, ProductsController.deleteProduct);
// router.patch('/:id/stock', isAuthenticated, isAdmin, ProductsController.updateStock);

// Tạm thời không có middleware authentication
router.post('/', ProductsController.createProduct);
router.put('/:id', ProductsController.updateProduct);
router.delete('/:id', ProductsController.deleteProduct);
router.patch('/:id/stock', ProductsController.updateStock);

module.exports = router;