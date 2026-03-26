"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationItemSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    type: {
        type: String,
        enum: ["order", "payment", "promotion", "system", "comment", "favorite", "general"],
        required: true,
    },
    relatedId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        refPath: "relatedModel",
    },
    relatedModel: {
        type: String,
        enum: ["Order", "Payment", "Product", "Comment", "User"],
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
    },
    actionUrl: { type: String, trim: true, default: "" },
    actionText: { type: String, trim: true, maxlength: 50, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    metadata: { type: mongoose_1.default.Schema.Types.Mixed, default: {} },
    expiresAt: Date,
    sentAt: { type: Date, default: Date.now },
    readAt: Date,
}, { _id: true, timestamps: { createdAt: true, updatedAt: false } });
/** Một user — một document; danh sách thông báo nằm trong `items`. */
const userNotificationInboxSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    items: {
        type: [notificationItemSchema],
        default: [],
    },
}, { timestamps: true });
userNotificationInboxSchema.index({ userId: 1 });
const UserNotificationInbox = mongoose_1.default.model("UserNotificationInbox", userNotificationInboxSchema);
exports.default = UserNotificationInbox;
