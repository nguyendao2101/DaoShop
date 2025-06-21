// src/services/UserService.js
const User = require('../models/user.model');

class UserService {
    // Get user profile
    async getUserProfile(userId) {
        const user = await User.findById(userId).select('-password -refreshToken -otp -otpExpires');

        if (!user || !user.isActive) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            userName: user.userName,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    // Update user profile
    async updateUserProfile(userId, updateData) {
        const allowedFields = ['fullName', 'avatar'];
        const updates = {};

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = updateData[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        ).select('-password -refreshToken -otp -otpExpires');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    // Change password
    async changeUserPassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isValidPassword = await user.comparePassword(currentPassword);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        user.password = newPassword; // Will be hashed by pre-save hook
        await user.save();

        return user;
    }

    // Deactivate user account
    async deactivateUser(userId) {
        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false, refreshToken: null },
            { new: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }
}

module.exports = new UserService();