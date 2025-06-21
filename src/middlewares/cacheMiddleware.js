// src/middlewares/cacheMiddleware.js
const mcache = require('memory-cache');

/**
 * Cache middleware sẽ lưu response trong bộ nhớ
 * @param {number} duration Thời gian cache tính bằng giây
 */
const cache = (duration) => {
    return (req, res, next) => {
        // Bỏ qua cache cho requests có phương thức không phải GET
        if (req.method !== 'GET') {
            return next();
        }

        // Tạo khóa cache từ URL và token xác thực (nếu có)
        const key = '__express__' + (req.originalUrl || req.url) +
            (req.headers.authorization ? '_auth' : '');

        // Kiểm tra cache
        const cachedBody = mcache.get(key);

        if (cachedBody) {
            // Gửi response từ cache
            res.set('X-Cache', 'HIT');
            return res.send(JSON.parse(cachedBody));
        } else {
            // Cache miss, lưu response mới
            res.set('X-Cache', 'MISS');

            // Lưu phương thức send gốc
            const originalSend = res.send;

            // Override phương thức send để lưu response vào cache
            res.send = function (body) {
                // Chỉ cache các responses thành công
                if (res.statusCode < 400) {
                    mcache.put(key, typeof body === 'object' ? JSON.stringify(body) : body, duration * 1000);
                }
                // Gọi phương thức send gốc
                return originalSend.call(this, body);
            };

            next();
        }
    };
};

/**
 * Xóa cache cho một route cụ thể
 * @param {string} route Route cần xóa cache
 */
const clearCache = (route) => {
    mcache.keys().forEach(key => {
        if (key.includes(route)) {
            mcache.del(key);
        }
    });
};

module.exports = { cache, clearCache };