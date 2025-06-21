const jwt = require('jsonwebtoken');
const User = require('../models/UserModel'); // Assuming UserModel is in models/UserModel.js
const environment = require('../config/env');

const authenticateToken = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        // Kiểm tra xem token có tồn tại không, nếu không trả về lỗi 401
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        // Giải mã token và kiểm tra tính hợp lệ
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // Tìm người dùng trong cơ sở dữ liệu dựa trên userId trong token
        const user = await User.findById(decoded.userId);
        // Kiểm tra xem người dùng có tồn tại và có trạng thái hoạt động không
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user not found'
            });
        }
        // Gán thông tin người dùng vào req để sử dụng trong các middleware hoặc route handler tiếp theo
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = { authenticateToken };

