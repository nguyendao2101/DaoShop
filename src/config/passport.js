// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/UserModel');
const GoogleOAuthService = require('../services/GoogleOAuthService');
const env = require('./env');

// Debug logs để kiểm tra env variables
console.log('🔑 Google OAuth Config:');
console.log('- CLIENT_ID:', env.google.clientId ? 'Set' : 'Missing');
console.log('- CLIENT_SECRET:', env.google.clientSecret ? 'Set' : 'Missing');
console.log('- CALLBACK_URL:', env.google.callbackUrl);

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: env.google.clientId,        // Sửa clientID -> clientId
    clientSecret: env.google.clientSecret,
    callbackURL: env.google.callbackUrl,  // Sửa callbackURL -> callbackUrl
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

        console.log('Google OAuth success for user:', user.email);
        return done(null, user);

    } catch (error) {
        console.error('Google OAuth error:', {
            message: error.message,
            stack: error.stack
        });
        return done(error, null);
    }
}));

// JWT Strategy cho protected routes
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.jwt.secret  // Sửa từ process.env.ACCESS_TOKEN_SECRET
}, async (payload, done) => {
    try {
        console.log('🔍 JWT Strategy - payload:', { userId: payload.userId, userName: payload.userName });

        const user = await User.findById(payload.userId);
        if (user && user.isActive) {
            console.log('JWT user found:', user.email);
            return done(null, user);
        } else {
            console.log('JWT user not found or inactive');
            return done(null, false);
        }
    } catch (error) {
        console.error('JWT Strategy error:', error);
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
            console.log('User deserialized:', user.email);
            done(null, user);
        } else {
            console.log('User not found during deserialization');
            done(null, null);
        }
    } catch (error) {
        console.error('Deserialize error:', error);
        done(error, null);
    }
});

module.exports = passport;