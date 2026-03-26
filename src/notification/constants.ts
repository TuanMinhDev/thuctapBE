export const NOTIFICATION_TYPES = [
    "order",
    "payment",
    "promotion",
    "system",
    "comment",
    "favorite",
    "general",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];
