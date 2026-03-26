"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrder = exports.updateStatusOrder = exports.getOrder = exports.createOrder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const orderModel_1 = __importDefault(require("../model/orderModel"));
const notificationService_1 = require("../../notification/services/notificationService");
const createOrder = async (req, res) => {
    try {
        const { products, user, description } = req.body;
        const userId = req.user?.userId;
        if (!userId || !products || !user) {
            res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
            return;
        }
        if (!Array.isArray(products) || products.length === 0) {
            res.status(400).json({ message: "products phải là mảng và không được rỗng" });
            return;
        }
        for (const product of products) {
            if (!product.productId || !product.color || !product.size) {
                res.status(400).json({ message: "Mỗi product phải có productId, color, size" });
                return;
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(product.productId)) {
                res.status(400).json({ message: `productId không hợp lệ: ${product.productId}` });
                return;
            }
            if (typeof product.quantity !== "number" || product.quantity <= 0) {
                res.status(400).json({ message: "quantity phải là số > 0" });
                return;
            }
        }
        if (!user.name || !user.phone || !user.address) {
            res.status(400).json({ message: "User phải có name, phone, address" });
            return;
        }
        const newOrder = new orderModel_1.default({
            userId,
            products,
            user,
            description: description || "",
            totalPrice: 0,
        });
        const savedOrder = await newOrder.save();
        let notification = null;
        try {
            const n = await (0, notificationService_1.notifyOrderCreatedSuccess)(userId, savedOrder._id, savedOrder.products.map((row) => ({ productId: row.productId })));
            notification = (0, notificationService_1.toNotificationJsonSnippet)(n);
        }
        catch (err) {
            // Đơn hàng đã lưu; lỗi thông báo không làm fail request — phải log để biết lý do DB không có bản ghi
            console.error("[createOrder] notifyOrderCreatedSuccess failed:", err);
        }
        res.status(201).json({ ...savedOrder.toObject(), notification });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createOrder = createOrder;
const getOrder = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Không tìm thấy thông tin người dùng" });
            return;
        }
        const orders = await orderModel_1.default.find({ userId })
            .populate("userId", "username email")
            .populate("products.productId")
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getOrder = getOrder;
const updateStatusOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Status field has been removed from model
        res.status(400).json({ message: "Tính năng cập nhật trạng thái đã bị vô hiệu hóa" });
        return;
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateStatusOrder = updateStatusOrder;
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await orderModel_1.default.findByIdAndDelete(id);
        if (!deletedOrder) {
            res.status(404).json({ message: "Không tìm thấy đơn hàng để xóa" });
            return;
        }
        res.status(200).json({ message: "Xóa đơn hàng thành công" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteOrder = deleteOrder;
