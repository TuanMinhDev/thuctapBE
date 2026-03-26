/**
 * Types cho FE — khớp JSON `GET /api/v1/notification/`
 * (copy file này sang frontend hoặc dùng shared package).
 */

export type NotificationType =
    | "order"
    | "payment"
    | "promotion"
    | "system"
    | "comment"
    | "favorite"
    | "general";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationRelatedModel = "Order" | "Payment" | "Product" | "Comment" | "User";

/**
 * `relatedId` sau populate có thể là object (Order, Product, …);
 * chưa populate hoặc lỗi thì thường là chuỗi ObjectId.
 */
export type NotificationRelatedId = string | Record<string, unknown>;

/** Một dòng trong `notifications[]` */
export interface NotificationListItem {
    _id: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedId?: NotificationRelatedId;
    relatedModel?: NotificationRelatedModel;
    isRead: boolean;
    priority: NotificationPriority;
    actionUrl: string;
    actionText: string;
    imageUrl: string;
    metadata: Record<string, unknown>;
    expiresAt?: string | null;
    sentAt?: string;
    readAt?: string | null;
    createdAt: string;
}

export interface NotificationListPagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

/** Body response danh sách thông báo */
export interface NotificationListResponse {
    notifications: NotificationListItem[];
    pagination: NotificationListPagination;
    /** Tổng chưa đọc của user (toàn bộ items, không chỉ trang hiện tại) */
    unreadCount: number;
}

/**
 * Trường `notification` trong JSON tạo đơn thành công (201)
 * — tương thích `toNotificationJsonSnippet` trên BE.
 */
export interface OrderCreatedNotificationSnippet {
    _id: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedId?: string;
    relatedModel?: NotificationRelatedModel;
    isRead: boolean;
    createdAt: string;
}
