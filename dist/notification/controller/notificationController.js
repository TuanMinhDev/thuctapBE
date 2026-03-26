"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.clearAllNotifications = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotificationById = exports.getNotificationsByUser = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const notificationModel_1 = __importDefault(require("../model/notificationModel"));
const constants_1 = require("../constants");
const routeItemId = (req) => String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
const getNotificationsByUser = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 10, type, isRead, priority } = req.query;
        if (!userId) {
            res.status(401).json({ message: "Chưa xác thực" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ message: "userId không hợp lệ" });
            return;
        }
        const oid = new mongoose_1.default.Types.ObjectId(userId);
        const inbox = await notificationModel_1.default.findOne({ userId: oid })
            .populate({ path: "items.relatedId" })
            .lean();
        if (!inbox || !inbox.items?.length) {
            res.status(200).json({
                notifications: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0,
                },
                unreadCount: 0,
            });
            return;
        }
        const allItems = [...inbox.items];
        const unreadCount = allItems.filter((it) => !it.isRead).length;
        let items = allItems;
        if (type && constants_1.NOTIFICATION_TYPES.includes(type)) {
            items = items.filter((it) => it.type === type);
        }
        if (isRead !== undefined) {
            const wantRead = isRead === "true";
            items = items.filter((it) => Boolean(it.isRead) === wantRead);
        }
        if (priority && constants_1.NOTIFICATION_PRIORITIES.includes(priority)) {
            items = items.filter((it) => it.priority === priority);
        }
        items.sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
        });
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const total = items.length;
        const notifications = items.slice(skip, skip + limitNum);
        res.status(200).json({
            notifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum) || 0,
            },
            unreadCount,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getNotificationsByUser = getNotificationsByUser;
const getNotificationById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = routeItemId(req);
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: "Chưa xác thực" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "ID thông báo không hợp lệ" });
            return;
        }
        const inbox = await notificationModel_1.default.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
        }).populate({ path: "items.relatedId" });
        if (!inbox) {
            res.status(404).json({ message: "Không tìm thấy thông báo" });
            return;
        }
        const sub = inbox.items.id(id);
        if (!sub) {
            res.status(404).json({ message: "Không tìm thấy thông báo" });
            return;
        }
        res.status(200).json(sub);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getNotificationById = getNotificationById;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = routeItemId(req);
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: "Chưa xác thực" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "ID thông báo không hợp lệ" });
            return;
        }
        const now = new Date();
        const result = await notificationModel_1.default.updateOne({ userId: new mongoose_1.default.Types.ObjectId(userId), "items._id": id }, { $set: { "items.$.isRead": true, "items.$.readAt": now } });
        if (result.matchedCount === 0) {
            res.status(404).json({ message: "Không tìm thấy thông báo" });
            return;
        }
        const inbox = await notificationModel_1.default.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
        }).populate({ path: "items.relatedId" });
        const updated = inbox?.items.id(id);
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: "Chưa xác thực" });
            return;
        }
        const inbox = await notificationModel_1.default.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
        });
        if (!inbox) {
            res.status(200).json({
                message: "Đánh dấu tất cả thông báo đã đọc thành công",
                modifiedCount: 0,
            });
            return;
        }
        const now = new Date();
        let modifiedCount = 0;
        for (const it of inbox.items) {
            if (!it.isRead) {
                it.isRead = true;
                it.readAt = now;
                modifiedCount += 1;
            }
        }
        await inbox.save();
        res.status(200).json({
            message: "Đánh dấu tất cả thông báo đã đọc thành công",
            modifiedCount,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = routeItemId(req);
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: "Chưa xác thực" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: "ID thông báo không hợp lệ" });
            return;
        }
        const uid = new mongoose_1.default.Types.ObjectId(userId);
        const inbox = await notificationModel_1.default.findOne({ userId: uid });
        if (!inbox) {
            res.status(404).json({ message: "Không tìm thấy thông báo để xóa" });
            return;
        }
        if (!inbox.items.id(id)) {
            res.status(404).json({ message: "Không tìm thấy thông báo để xóa" });
            return;
        }
        await notificationModel_1.default.updateOne({ userId: uid }, { $pull: { items: { _id: id } } });
        res.status(200).json({ message: "Xóa thông báo thành công" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteNotification = deleteNotification;
const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: "Chưa xác thực" });
            return;
        }
        const uid = new mongoose_1.default.Types.ObjectId(userId);
        const inbox = await notificationModel_1.default.findOne({ userId: uid }).lean();
        const prevCount = inbox?.items?.length ?? 0;
        await notificationModel_1.default.updateOne({ userId: uid }, { $set: { items: [] } });
        res.status(200).json({
            message: "Xóa tất cả thông báo thành công",
            deletedCount: prevCount,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.clearAllNotifications = clearAllNotifications;
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ message: "Chưa xác thực" });
            return;
        }
        const oid = new mongoose_1.default.Types.ObjectId(userId);
        const inbox = await notificationModel_1.default.findOne({ userId: oid }).lean();
        const items = inbox?.items ?? [];
        const unread = items.filter((it) => !it.isRead);
        const priorityCounts = {};
        const typeCounts = {};
        for (const it of unread) {
            const p = it.priority ?? "unknown";
            const t = it.type ?? "unknown";
            priorityCounts[p] = (priorityCounts[p] ?? 0) + 1;
            typeCounts[t] = (typeCounts[t] ?? 0) + 1;
        }
        res.status(200).json({
            unreadCount: unread.length,
            priorityCounts,
            typeCounts,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUnreadCount = getUnreadCount;
