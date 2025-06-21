// src/services/GoogleOAuthService.js
const User = require('../models/UserModel');
const env = require('../config/env');

class GoogleOAuthService {
    // Generate username từ email
    generateUserName(email) {
        const emailPrefix = email.split('@')[0];

        if (emailPrefix.length <= 16) {
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            return `${emailPrefix}_${randomSuffix}`;
        }

        const truncatedPrefix = emailPrefix.substring(0, 16);
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        return `${truncatedPrefix}_${randomSuffix}`;
    }

    // Ensure unique username
    async ensureUniqueUserName(baseUserName) {
        let userName = baseUserName;
        let existingUser = await User.findOne({ userName });
        let counter = 1;

        while (existingUser) {
            const suffix = `_${counter}`;
            const maxPrefixLength = 20 - suffix.length;
            userName = baseUserName.substring(0, maxPrefixLength) + suffix;

            existingUser = await User.findOne({ userName });
            counter++;

            if (counter > 100) {
                userName = `user_${Date.now().toString().slice(-8)}`;
                break;
            }
        }

        return userName;
    }

    // Process Google OAuth callback
    async processGoogleUser(profile) {
        const email = profile.emails[0].value;

        // Tìm user theo email trước
        let user = await User.findOne({ email });

        if (user) {
            // User đã tồn tại, update info
            let needUpdate = false;

            if (!user.googleId) {
                user.googleId = profile.id;
                needUpdate = true;
            }

            if (!user.avatar && profile.photos[0]?.value) {
                user.avatar = profile.photos[0].value;
                needUpdate = true;
            }

            if (!user.fullName && profile.displayName) {
                user.fullName = profile.displayName;
                needUpdate = true;
            }

            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                needUpdate = true;
            }

            if (needUpdate) {
                await user.save();
            }
        } else {
            // Tạo user mới
            const baseUserName = this.generateUserName(email);
            const userName = await this.ensureUniqueUserName(baseUserName);

            user = new User({
                googleId: profile.id,
                email: email,
                userName: userName,
                fullName: profile.displayName || 'Google User',
                avatar: profile.photos[0]?.value || null,
                isEmailVerified: true,
                password: 'google_oauth_' + Math.random().toString(36).substring(2, 12),
                isActive: true
            });

            await user.save();
        }

        return user;
    }

    // Generate tokens và redirect URL
    async generateOAuthResponse(user) {
        const { accessToken, refreshToken } = user.generateTokens();
        user.refreshToken = refreshToken;
        await user.save();

        const redirectUrl = `${env.frontend.url}/auth/success?token=${accessToken}`;

        return { accessToken, refreshToken, redirectUrl };
    }
}

module.exports = new GoogleOAuthService();