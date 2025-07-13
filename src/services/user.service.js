// src/services/UserService.js
const User = require('../models/user.model');

class UserService {
    // Get user profile
    async getUserProfile(userId) {
        try {
            console.log('👤 Getting user profile for:', userId);

            const user = await User.findById(userId).select('-password -refreshToken -otp -otpExpires');

            if (!user || !user.isActive) {
                throw new Error('User not found');
            }

            return {
                id: user._id,
                userName: user.userName,
                email: user.email,
                fullName: user.fullName || '',
                phone: user.phone || '',
                dateOfBirth: user.dateOfBirth || null,
                gender: user.gender || '',
                address: user.address || {
                    street: '',
                    ward: '',
                    district: '',
                    city: '',
                    zipCode: ''
                },
                avatar: user.avatar || '',
                isEmailVerified: user.isEmailVerified,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        } catch (error) {
            logger.error('Error getting user profile:', error);
            throw new Error(`Failed to get user profile: ${error.message}`);
        }
    }

    // Update user profile
    async updateUserProfile(userId, updateData) {
        try {
            console.log('👤 Updating user profile for:', userId);

            // Expanded allowed fields
            const allowedFields = [
                'fullName',
                'phone',
                'dateOfBirth',
                'gender',
                'address',
                'avatar'
            ];

            const updates = {};

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key) && updateData[key] !== undefined) {
                    updates[key] = updateData[key];
                }
            });

            console.log('Filtered updates:', updates);

            // Basic validation
            if (updates.phone && updates.phone !== '') {
                const phoneRegex = /^[0-9]{10,11}$/;
                if (!phoneRegex.test(updates.phone)) {
                    throw new Error('Invalid phone number format. Please use 10-11 digits.');
                }
            }

            if (updates.dateOfBirth) {
                const birthDate = new Date(updates.dateOfBirth);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();

                if (age < 13 || age > 120) {
                    throw new Error('Invalid date of birth. Age must be between 13 and 120.');
                }
            }

            if (updates.gender && !['male', 'female', 'other', ''].includes(updates.gender)) {
                throw new Error('Invalid gender value. Must be: male, female, other, or empty.');
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-password -refreshToken -otp -otpExpires');

            if (!user) {
                throw new Error('User not found');
            }

            console.log('Profile updated successfully');

            return {
                id: user._id,
                userName: user.userName,
                email: user.email,
                fullName: user.fullName || '',
                phone: user.phone || '',
                dateOfBirth: user.dateOfBirth || null,
                gender: user.gender || '',
                address: user.address || {
                    street: '',
                    ward: '',
                    district: '',
                    city: '',
                    zipCode: ''
                },
                avatar: user.avatar || '',
                isEmailVerified: user.isEmailVerified,
                isActive: user.isActive,
                updatedAt: user.updatedAt
            };
        } catch (error) {
            logger.error('Error updating user profile:', error);
            throw new Error(`Failed to update user profile: ${error.message}`);
        }
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