# DaoShop
# Lệnh chạy eslint: 
" npx eslint src/index.js "
# Lệnh tạo token_secret: 
" node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" "







# Các bước xây dựng API
Bước 1: Khởi tạo dự án
Bước 2: Cấu hình môi trường trong file .env
Bước 3: Kết nối DB
Bước 4: Tạo Model
Bước 5: Tạo Middleware
Bước 6: Tạo Validation(nếu có)
Bước 7: Tạo Controller
Bước 8: Tạo Routes
Bước 9: Entry Point