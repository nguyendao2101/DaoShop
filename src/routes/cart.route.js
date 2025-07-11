// src/routes/cart.route.js - ADD SWAGGER DOCS
const express = require('express');
const CartController = require('../controllers/cart.controller');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả routes cần authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     description: Trả về thông tin giỏ hàng hiện tại của người dùng đang đăng nhập
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               success: true
 *               data:
 *                 userId: "6870c70c1ca5164be10bb91d"
 *                 items:
 *                   - productId: "BT1"
 *                     sizeIndex: 0
 *                     quantity: 2
 *                     price: 250000
 *                     addedAt: "2025-07-11T08:30:00.000Z"
 *                   - productId: "DC1"
 *                     sizeIndex: 1
 *                     quantity: 1
 *                     price: 450000
 *                     addedAt: "2025-07-11T08:25:00.000Z"
 *                 totalAmount: 950000
 *                 totalItems: 2
 *                 lastUpdated: "2025-07-11T08:30:00.000Z"
 *               message: "Cart retrieved successfully"
 *       401:
 *         description: Không có token hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Access token required"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', CartController.getCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     description: Thêm một sản phẩm với size và số lượng cụ thể vào giỏ hàng. Nếu sản phẩm đã tồn tại, sẽ cộng dồn số lượng.
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *           examples:
 *             addNewProduct:
 *               summary: Thêm sản phẩm mới
 *               value:
 *                 productId: "BT1"
 *                 sizeIndex: 0
 *                 quantity: 1
 *             addMultipleQuantity:
 *               summary: Thêm với số lượng nhiều
 *               value:
 *                 productId: "DC1"
 *                 sizeIndex: 2
 *                 quantity: 3
 *     responses:
 *       200:
 *         description: Thêm vào giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               success: true
 *               data:
 *                 userId: "6870c70c1ca5164be10bb91d"
 *                 items:
 *                   - productId: "BT1"
 *                     sizeIndex: 0
 *                     quantity: 1
 *                     price: 250000
 *                     addedAt: "2025-07-11T08:30:00.000Z"
 *                 totalAmount: 250000
 *                 totalItems: 1
 *                 lastUpdated: "2025-07-11T08:30:00.000Z"
 *               message: "Product added to cart successfully"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 summary: Thiếu thông tin bắt buộc
 *                 value:
 *                   success: false
 *                   message: "Missing required fields: productId, sizeIndex, quantity"
 *               invalidQuantity:
 *                 summary: Số lượng không hợp lệ
 *                 value:
 *                   success: false
 *                   message: "Quantity must be a positive integer"
 *               productNotFound:
 *                 summary: Sản phẩm không tồn tại
 *                 value:
 *                   success: false
 *                   message: "Failed to add to cart: Product not found"
 *               sizeNotAvailable:
 *                 summary: Size không có sẵn
 *                 value:
 *                   success: false
 *                   message: "Failed to add to cart: Size index 5 not available. Available sizes: 0, 1, 2, 3"
 *               insufficientStock:
 *                 summary: Không đủ hàng tồn kho
 *                 value:
 *                   success: false
 *                   message: "Failed to add to cart: Insufficient stock. Available: 3, Requested: 5"
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/add', CartController.addToCart);

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     description: Cập nhật số lượng của một sản phẩm cụ thể trong giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartRequest'
 *           examples:
 *             updateQuantity:
 *               summary: Cập nhật số lượng
 *               value:
 *                 productId: "BT1"
 *                 sizeIndex: 0
 *                 quantity: 3
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               success: true
 *               data:
 *                 userId: "6870c70c1ca5164be10bb91d"
 *                 items:
 *                   - productId: "BT1"
 *                     sizeIndex: 0
 *                     quantity: 3
 *                     price: 250000
 *                     addedAt: "2025-07-11T08:30:00.000Z"
 *                 totalAmount: 750000
 *                 totalItems: 1
 *                 lastUpdated: "2025-07-11T08:35:00.000Z"
 *               message: "Cart updated successfully"
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc sản phẩm không tồn tại trong giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               itemNotFound:
 *                 summary: Sản phẩm không có trong giỏ hàng
 *                 value:
 *                   success: false
 *                   message: "Failed to update cart: Item not found in cart"
 *               invalidQuantity:
 *                 summary: Số lượng không hợp lệ
 *                 value:
 *                   success: false
 *                   message: "Quantity must be a positive integer"
 *       401:
 *         description: Không có quyền truy cập
 */
router.put('/update', CartController.updateQuantity);

/**
 * @swagger
 * /api/cart/remove/{productId}/{sizeIndex}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     description: Xóa hoàn toàn một sản phẩm với size cụ thể khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sản phẩm cần xóa
 *         example: "BT1"
 *       - in: path
 *         name: sizeIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Chỉ số size cần xóa
 *         example: 0
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               success: true
 *               data:
 *                 userId: "6870c70c1ca5164be10bb91d"
 *                 items: []
 *                 totalAmount: 0
 *                 totalItems: 0
 *                 lastUpdated: "2025-07-11T08:40:00.000Z"
 *               message: "Item removed from cart successfully"
 *       400:
 *         description: Sản phẩm không tồn tại trong giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Failed to remove item: Item not found in cart"
 *       401:
 *         description: Không có quyền truy cập
 */
router.delete('/remove/:productId/:sizeIndex', CartController.removeItem);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     description: Xóa tất cả sản phẩm trong giỏ hàng của người dùng
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *             example:
 *               success: true
 *               data:
 *                 userId: "6870c70c1ca5164be10bb91d"
 *                 items: []
 *                 totalAmount: 0
 *                 totalItems: 0
 *                 lastUpdated: "2025-07-11T08:45:00.000Z"
 *               message: "Cart cleared successfully"
 *       400:
 *         description: Lỗi khi xóa giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Failed to clear cart: Cart not found"
 *       401:
 *         description: Không có quyền truy cập
 */
router.delete('/clear', CartController.clearCart);

module.exports = router;