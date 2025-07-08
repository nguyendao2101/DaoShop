// src/models/comment.model.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 1000
    },
    hasFix: {
        type: String,
        enum: ['true', 'false'],
        default: 'false'
    },
    idProduct: {
        type: String,
        required: true,
        ref: 'Product'
    },
    idUser: {
        type: String,
        required: true,
        ref: 'User'
    },
    nameUser: {
        type: String,
        required: true,
        trim: true
    },
    timeComment: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    replies: [{
        content: String,
        userId: String,
        userName: String,
        timeReply: String,
        isActive: { type: Boolean, default: true }
    }],
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: String,
        ref: 'User'
    }]
}, {
    timestamps: true,
    collection: 'comments'
});

// Indexes
commentSchema.index({ idProduct: 1, timeComment: -1 });
commentSchema.index({ idUser: 1 });
commentSchema.index({ isActive: 1 });

// Static methods
commentSchema.statics.getCommentsByProduct = async function (productId, filters = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'timeComment',
        sortOrder = 'desc'
    } = filters;

    console.log('🔍 CommentModel.getCommentsByProduct called with:', { productId, filters });

    const skip = (page - 1) * limit;
    const sortCondition = {};
    sortCondition[sortBy] = sortOrder === 'asc' ? 1 : -1;

    console.log('📊 Query conditions:', {
        idProduct: productId,
        isActive: true,
        skip,
        limit: parseInt(limit),
        sort: sortCondition
    });

    const result = await this.find({
        idProduct: productId,
        isActive: true
    })
        .sort(sortCondition)
        .skip(skip)
        .limit(parseInt(limit));

    console.log('✅ Query result:', result.length, 'comments found');

    return result;
};

commentSchema.statics.getCommentsByUser = async function (userId, filters = {}) {
    const {
        page = 1,
        limit = 10
    } = filters;

    console.log('🔍 CommentModel.getCommentsByUser called with:', { userId, filters });

    const skip = (page - 1) * limit;

    // THÊM DEBUG: Kiểm tra query trực tiếp cho user
    console.log('🔍 Testing direct user query...');
    const directUserQuery = await this.find({ idUser: userId });
    console.log('📊 Direct user query result:', directUserQuery.length, 'comments');

    const activeUserQuery = await this.find({ idUser: userId, isActive: true });
    console.log('📊 Active user query result:', activeUserQuery.length, 'comments');

    console.log('📊 User query conditions:', {
        idUser: userId,
        isActive: true,
        skip,
        limit: parseInt(limit),
        sort: { timeComment: -1 }
    });

    const result = await this.find({
        idUser: userId,
        isActive: true
    })
        .sort({ timeComment: -1 }) // Sắp xếp mới nhất trước
        .skip(skip)
        .limit(parseInt(limit));

    console.log('✅ User query result:', result.length, 'comments found');

    return result;
};

// Instance methods
commentSchema.methods.addReply = function (replyData) {
    this.replies.push({
        content: replyData.content,
        userId: replyData.userId,
        userName: replyData.userName,
        timeReply: new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        })
    });
};

commentSchema.methods.toggleLike = function (userId) {
    const likedIndex = this.likedBy.indexOf(userId);

    if (likedIndex > -1) {
        // Unlike
        this.likedBy.splice(likedIndex, 1);
        this.likes = Math.max(0, this.likes - 1);
        return false;
    } else {
        // Like
        this.likedBy.push(userId);
        this.likes += 1;
        return true;
    }
};

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;