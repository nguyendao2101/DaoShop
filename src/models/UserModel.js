const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    refreshToken: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // ✅ Thêm các field OTP
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'auth'
});

// Hash password trước khi save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method so sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
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

// ✅ Method tạo OTP
userSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
    this.otp = otp;
    this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    console.log('🔑 Generated OTP:', otp, 'Expires at:', this.otpExpires);
    return otp;
};

// ✅ Method verify OTP
userSchema.methods.verifyOTP = function (inputOTP) {
    console.log('🔍 Debugging OTP verification:');
    console.log('- Input OTP:', inputOTP);
    console.log('- Stored OTP:', this.otp);
    console.log('- OTP Expires:', this.otpExpires);
    console.log('- Current Time:', new Date());

    if (!this.otp || !this.otpExpires) {
        console.log('❌ No OTP or expiry found');
        return false;
    }

    if (new Date() > this.otpExpires) {
        console.log('❌ OTP expired');
        return false;
    }

    const isValid = this.otp === inputOTP;
    console.log('- OTP Match?', isValid);

    return isValid;
};

module.exports = mongoose.model('User', userSchema);