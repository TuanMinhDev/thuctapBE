import { Router } from "express";
import { checkPermission } from "../auth_user/middleware";
import {
    getNotificationsByUser,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount,
} from "./controller/notificationController";

const router = Router();

router.get("/", checkPermission(["admin", "user"]), getNotificationsByUser);
router.get("/unread-count", checkPermission(["admin", "user"]), getUnreadCount);
router.post("/read-all", checkPermission(["admin", "user"]), markAllAsRead);
router.delete("/clear-all", checkPermission(["admin", "user"]), clearAllNotifications);
router.get("/:id", checkPermission(["admin", "user"]), getNotificationById);
router.post("/:id/read", checkPermission(["admin", "user"]), markAsRead);
router.delete("/:id", checkPermission(["admin", "user"]), deleteNotification);

export default router;
