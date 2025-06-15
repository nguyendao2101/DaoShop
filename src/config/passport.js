// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/UserModel');
const GoogleOAuthService = require('../services/GoogleOAuthService');

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

        // Sử dụng GoogleOAuthService
        const user = await GoogleOAuthService.processGoogleUser(profile);

        console.log('✅ Google OAuth success for user:', user.email);
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