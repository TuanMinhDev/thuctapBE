import mongoose from "mongoose";
import UserNotificationInbox from "../model/notificationModel";
import User from "../../auth_user/model/userModel";
import Product from "../../product/model/productModel";

const INSERT_CHUNK = 500;

const toObjectId = (id: string | mongoose.Types.ObjectId) =>
    new mongoose.Types.ObjectId(String(id));

export type NotificationItemPayload = {
    _id: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: string;
    relatedId?: mongoose.Types.ObjectId;
    relatedModel?: string;
    priority?: string;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
    expiresAt?: Date;
    sentAt?: Date;
    isRead?: boolean;
    readAt?: Date;
};

/** Dữ liệu thông báo đưa vào `res.json` (id/date dạng string, khớp FE) */
export type NotificationJsonSnippet = {
    _id: string;
    title: string;
    message: string;
    type: string;
    relatedId?: string;
    relatedModel?: string;
    isRead: boolean;
    createdAt: string;
};

export function toNotificationJsonSnippet(n: NotificationItemPayload): NotificationJsonSnippet {
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
export async function pushNotificationForUser(input: {
    userId: string | mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: string;
    relatedId?: mongoose.Types.ObjectId;
    relatedModel?: string;
    priority?: string;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
    expiresAt?: Date | null;
}): Promise<NotificationItemPayload> {
    const uid = toObjectId(input.userId);
    const itemId = new mongoose.Types.ObjectId();
    const now = new Date();
    const item: NotificationItemPayload = {
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

    await UserNotificationInbox.findOneAndUpdate(
        { userId: uid },
        {
            $setOnInsert: { userId: uid },
            $push: { items: { ...item, createdAt: now } },
        },
        { upsert: true, new: true }
    );

    return item;
}

const clampMessage = (s: string, max = 500) =>
    s.length <= max ? s : `${s.slice(0, max - 1)}…`;

const clampTitle = (s: string, max = 100) =>
    s.length <= max ? s : `${s.slice(0, max - 1)}…`;

/**
 * @param orderProducts — các dòng trong đơn (sau save); 1 dòng → lấy tên SP từ DB, 2+ → “Bạn đã đặt N sản phẩm”.
 */
export async function notifyOrderCreatedSuccess(
    userId: string | mongoose.Types.ObjectId,
    orderId: mongoose.Types.ObjectId,
    orderProducts: { productId: string | mongoose.Types.ObjectId }[]
) {
    const n = orderProducts.length;
    let message: string;

    if (n === 1) {
        const pid = orderProducts[0].productId;
        const doc = await Product.findById(pid).select("name").lean();
        const name = (doc as { name?: string } | null)?.name?.trim() || "sản phẩm";
        message = `Bạn đã đặt “${name}”. Đơn hàng đã được ghi nhận, chúng tôi sẽ xử lý sớm nhất có thể.`;
    } else {
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
export async function notifyAllUsersNewProduct(
    productId: mongoose.Types.ObjectId,
    productName: string,
    imageUrl = ""
) {
    const users = await User.find().select("_id").lean();
    if (users.length === 0) return { notifiedCount: 0 };

    const title = clampTitle(`Mới: ${productName}`);
    const message = clampMessage(
        `Sản phẩm “${productName}” vừa được thêm. Mời bạn xem chi tiết tại cửa hàng.`
    );

    let notifiedCount = 0;
    for (let i = 0; i < users.length; i += INSERT_CHUNK) {
        const chunk = users.slice(i, i + INSERT_CHUNK);
        const now = new Date();
        const ops = chunk.map((u) => {
            const itemId = new mongoose.Types.ObjectId();
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
        await UserNotificationInbox.bulkWrite(ops as any, { ordered: false });
        notifiedCount += chunk.length;
    }

    return { notifiedCount };
}
