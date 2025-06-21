// src/services/AuthService.js
const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const env = require('../config/env'); // Import config for environment variables

class AuthService {
    // Kiểm tra user tồn tại
    async checkUserExists(userName, email) {
        return await User.findOne({
            $or: [{ userName }, { email }]
        });
    }

    // Tạo user mới
    async createUser(userData) {
        const user = new User({
            userName: userData.userName,
            password: userData.password,
            email: userData.email,
            isEmailVerified: false
        });

        const otp = user.generateOTP();
        await user.save();

        return { user, otp };
    }

    // Verify OTP và activate user
    async verifyUserOTP(email, otp) {
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isEmailVerified) {
            throw new Error('Email already verified');
        }

        if (!user.verifyOTP(otp)) {
            throw new Error('Invalid or expired OTP');
        }

        // Activate user
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return user;
    }

    // Resend OTP
    async resendOTP(email) {
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isEmailVerified) {
            throw new Error('Email already verified');
        }

        const otp = user.generateOTP();
        await user.save();

        return { user, otp };
    }

    // Login với email/username
    async loginUser(loginIdentifier, password) {
        const user = await User.findByEmailOrUsername(loginIdentifier);

        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }

        // Check if Google user
        if (user.googleId && user.password && user.password.startsWith('google_oauth_')) {
            throw new Error('GOOGLE_USER');
        }

        if (!user.isEmailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED');
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        return user;
    }

    // Generate và lưu tokens
    async generateUserTokens(user) {
        const { accessToken, refreshToken } = user.generateTokens();
        user.refreshToken = refreshToken;
        await user.save();

        return { accessToken, refreshToken };
    }

    // Refresh token
    async refreshUserToken(refreshToken) {
        const decoded = jwt.verify(refreshToken, env.jwt.refreshTokenSecret);
        const user = await User.findOne({
            _id: decoded.userId,
            refreshToken: refreshToken
        });

        if (!user || !user.isActive) {
            throw new Error('Invalid refresh token');
        }

        const { accessToken, refreshToken: newRefreshToken } = user.generateTokens();
        user.refreshToken = newRefreshToken;
        await user.save();

        return { accessToken, refreshToken: newRefreshToken };
    }

    // Logout
    async logoutUser(refreshToken) {
        if (refreshToken) {
            await User.updateOne(
                { refreshToken },
                { $unset: { refreshToken: 1 } }
            );
        }
    }

    // Set password cho Google users
    async setUserPassword(email, password) {
        const user = await User.findOne({ email });

        if (!user || !user.googleId) {
            throw new Error('Invalid request');
        }

        user.password = password; // Will be hashed by pre-save hook
        await user.save();

        return user;
    }
}

module.exports = new AuthService();