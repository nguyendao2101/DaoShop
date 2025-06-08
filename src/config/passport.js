// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/UserModel');

// Debug logs để kiểm tra env variables
console.log('🔑 Google OAuth Config:');
console.log('- CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Missing ❌');
console.log('- CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');
console.log('- CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

// Kiểm tra required env variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Missing Google OAuth credentials in .env file');
    console.error('Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
    process.exit(1);
}

// Helper function tạo userName thông minh
function generateUserName(email) {
    const emailPrefix = email.split('@')[0];

    // Nếu emailPrefix <= 16 chars, thêm 3 digit random
    if (emailPrefix.length <= 16) {
        const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digits (100-999)
        return `${emailPrefix}_${randomSuffix}`;
    }

    // Nếu emailPrefix > 16 chars, cắt xuống 16 chars + 3 digit random  
    const truncatedPrefix = emailPrefix.substring(0, 16);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `${truncatedPrefix}_${randomSuffix}`;
}

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔍 Google Profile received:', {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0]?.value
        });

        // Tìm user đã tồn tại
        let user = await User.findOne({
            $or: [
                { googleId: profile.id },
                { email: profile.emails[0].value }
            ]
        });

        if (user) {
            console.log('✅ Existing user found:', user.email);

            // Cập nhật thông tin user nếu cần
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
                user.isEmailVerified = true; // Google đã verify email
                needUpdate = true;
            }

            if (needUpdate) {
                await user.save();
                console.log('✅ User info updated');
            }
        } else {
            console.log('🆕 Creating new user for:', profile.emails[0].value);

            // Tạo userName unique và ngắn gọn
            let userName = generateUserName(profile.emails[0].value);

            console.log('🔍 Initial userName:', userName, 'Length:', userName.length);

            // Đảm bảo userName unique
            let existingUser = await User.findOne({ userName });
            let counter = 1;

            while (existingUser) {
                // Nếu trùng, thêm counter: user_123_2, user_123_3, etc.
                const baseUserName = generateUserName(profile.emails[0].value);
                const suffix = `_${counter}`;
                const maxPrefixLength = 20 - suffix.length;
                userName = baseUserName.substring(0, maxPrefixLength) + suffix;

                existingUser = await User.findOne({ userName });
                counter++;

                // Prevent infinite loop
                if (counter > 100) {
                    userName = `user_${Date.now().toString().slice(-8)}`;
                    break;
                }
            }

            console.log('🔍 Final userName:', userName, 'Length:', userName.length);

            // Tạo user mới
            user = new User({
                googleId: profile.id,
                email: profile.emails[0].value,
                userName: userName,
                fullName: profile.displayName || 'Google User',
                avatar: profile.photos[0]?.value || null,
                isEmailVerified: true, // Google đã verify email
                password: 'google_oauth_' + Math.random().toString(36).substring(2, 12), // Random secure password
                isActive: true
            });

            await user.save();
            console.log('✅ New user created successfully:', {
                id: user._id,
                email: user.email,
                userName: user.userName,
                fullName: user.fullName
            });
        }

        return done(null, user);
    } catch (error) {
        console.error('❌ Google OAuth error:', {
            message: error.message,
            stack: error.stack
        });
        return done(error, null);
    }
}));

// JWT Strategy cho protected routes
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET
}, async (payload, done) => {
    try {
        console.log('🔍 JWT Strategy - payload:', { userId: payload.userId, userName: payload.userName });

        const user = await User.findById(payload.userId);
        if (user && user.isActive) {
            console.log('✅ JWT user found:', user.email);
            return done(null, user);
        } else {
            console.log('❌ JWT user not found or inactive');
            return done(null, false);
        }
    } catch (error) {
        console.error('❌ JWT Strategy error:', error);
        return done(error, false);
    }
}));

// Serialize user cho session
passport.serializeUser((user, done) => {
    console.log('🔍 Serializing user:', user._id);
    done(null, user._id);
});

// Deserialize user từ session
passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔍 Deserializing user:', id);
        const user = await User.findById(id);
        if (user && user.isActive) {
            console.log('✅ User deserialized:', user.email);
            done(null, user);
        } else {
            console.log('❌ User not found during deserialization');
            done(null, null);
        }
    } catch (error) {
        console.error('❌ Deserialize error:', error);
        done(error, null);
    }
});

module.exports = passport;