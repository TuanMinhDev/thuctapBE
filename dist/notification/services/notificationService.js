"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNotificationJsonSnippet = toNotificationJsonSnippet;
exports.pushNotificationForUser = pushNotificationForUser;
exports.notifyOrderCreatedSuccess = notifyOrderCreatedSuccess;
exports.notifyAllUsersNewProduct = notifyAllUsersNewProduct;
const mongoose_1 = __importDefault(require("mongoose"));
const notificationModel_1 = __importDefault(require("../model/notificationModel"));
const userModel_1 = __importDefault(require("../../auth_user/model/userModel"));
const productModel_1 = __importDefault(require("../../product/model/productModel"));
const INSERT_CHUNK = 500;
const toObjectId = (id) => new mongoose_1.default.Types.ObjectId(String(id));
function toNotificationJsonSnippet(n) {
    return {
        _id: String(n._id),
        title: n.title,
        message: n.message,
        type: n.type,
        relatedId: n.relatedId != null ? String(n.relatedId) : undefined,
        relatedModel: n.relatedModel,
        isRead: n.isRead ?? false,
        createdAt: (n.sentAt ?? new Date()).toISOString(),
    };
}
/**
 * Thêm một thông báo vào mảng `items` của user.
 * Chưa có document inbox → upsert tạo mới; đã có → chỉ $push.
 */
async function pushNotificationForUser(input) {
    const uid = toObjectId(input.userId);
    const itemId = new mongoose_1.default.Types.ObjectId();
    const now = new Date();
    const item = {
        _id: itemId,
        title: input.title,
        message: input.message,
        type: input.type,
        relatedId: input.relatedId,
        relatedModel: input.relatedModel,
        priority: input.priority ?? "medium",
        actionUrl: input.actionUrl ?? "",
        actionText: input.actionText ?? "",
        imageUrl: input.imageUrl ?? "",
        metadata: input.metadata ?? {},
        expiresAt: input.expiresAt ?? undefined,
        isRead: false,
        sentAt: now,
    };
    await notificationModel_1.default.findOneAndUpdate({ userId: uid }, {
        $setOnInsert: { userId: uid },
        $push: { items: { ...item, createdAt: now } },
    }, { upsert: true, new: true });
    return item;
}
const clampMessage = (s, max = 500) => s.length <= max ? s : `${s.slice(0, max - 1)}…`;
const clampTitle = (s, max = 100) => s.length <= max ? s : `${s.slice(0, max - 1)}…`;
/**
 * @param orderProducts — các dòng trong đơn (sau save); 1 dòng → lấy tên SP từ DB, 2+ → “Bạn đã đặt N sản phẩm”.
 */
async function notifyOrderCreatedSuccess(userId, orderId, orderProducts) {
    const n = orderProducts.length;
    let message;
    if (n === 1) {
        const pid = orderProducts[0].productId;
        const doc = await productModel_1.default.findById(pid).select("name").lean();
        const name = doc?.name?.trim() || "sản phẩm";
        message = `Bạn đã đặt “${name}”. Đơn hàng đã được ghi nhận, chúng tôi sẽ xử lý sớm nhất có thể.`;
    }
    else {
        message = `Bạn đã đặt ${n} sản phẩm. Đơn hàng đã được ghi nhận, chúng tôi sẽ xử lý sớm nhất có thể.`;
    }
    return pushNotificationForUser({
        userId,
        title: "Tạo đơn hàng thành công",
        message: clampMessage(message),
        type: "order",
        relatedId: orderId,
        relatedModel: "Order",
        priority: "medium",
        metadata: { event: "order_created", lineItemCount: n },
    });
}
/**
 * Gửi cùng một thông báo sản phẩm mới cho mọi user (mỗi user một $push / upsert inbox).
 */
async function notifyAllUsersNewProduct(productId, productName, imageUrl = "") {
    const users = await userModel_1.default.find().select("_id").lean();
    if (users.length === 0)
        return { notifiedCount: 0 };
    const title = clampTitle(`Mới: ${productName}`);
    const message = clampMessage(`Sản phẩm “${productName}” vừa được thêm. Mời bạn xem chi tiết tại cửa hàng.`);
    let notifiedCount = 0;
    for (let i = 0; i < users.length; i += INSERT_CHUNK) {
        const chunk = users.slice(i, i + INSERT_CHUNK);
        const now = new Date();
        const ops = chunk.map((u) => {
            const itemId = new mongoose_1.default.Types.ObjectId();
            const item = {
                _id: itemId,
                title,
                message,
                type: "general",
                relatedId: productId,
                relatedModel: "Product",
                isRead: false,
                priority: "medium",
                actionUrl: "",
                actionText: "",
                imageUrl: imageUrl ?? "",
                metadata: { event: "product_created" },
                sentAt: now,
                createdAt: now,
            };
            return {
                updateOne: {
                    filter: { userId: u._id },
                    update: {
                        $setOnInsert: { userId: u._id },
                        $push: { items: item },
                    },
                    upsert: true,
                },
            };
        });
        // Raw $push payload; Mongoose bulkWrite typings chưa khớp plain object
        await notificationModel_1.default.bulkWrite(ops, { ordered: false });
        notifiedCount += chunk.length;
    }
    return { notifiedCount };
}
