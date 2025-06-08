const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true, //đảm bảo là duy nhất
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    password: {     // Mật khẩu của người dùng
        type: String,
        required: true,
        minlength: 6
    },
    email: { // Email của người dùng
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    refreshToken: { // Token dùng để refresh access token
        type: String,
        default: null
    },
    isActive: { // Trạng thái người dùng
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'auth' // Tên collection trong MongoDB
});

// Hash password trước khi save (mã hóa mật khẩu trước khi lưu vào db)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // Nếu mật khẩu không thay đổi thì không cần hash lại

    try {
        const salt = await bcrypt.genSalt(10); // Tạo salt với độ dài 10, tăng độ bảo mật
        this.password = await bcrypt.hash(this.password, salt); // Hash mật khẩu với salt
        next();
    } catch (error) {
        next(error);
    }
});

// Method so sánh password
userSchema.methods.comparePassword = async function (candidatePassword) { //candidatePassword là mật khẩu người dùng nhập vào
    return await bcrypt.compare(candidatePassword, this.password);  // So sánh mật khẩu đã hash với mật khẩu người dùng nhập vào
};

// Method tạo tokens
userSchema.methods.generateTokens = function () {
    const jwt = require('jsonwebtoken');

    const accessToken = jwt.sign(
        {
            userId: this._id,
            userName: this.userName
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        {
            userId: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

module.exports = mongoose.model('User', userSchema);