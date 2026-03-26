"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImages = void 0;
const multer_1 = __importDefault(require("multer"));
/**
 * Dùng memoryStorage để tránh phụ thuộc vào việc ghi file xuống ổ cứng.
 * Controller sẽ lấy `file.buffer` để upload lên Cloudinary.
 */
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
};
exports.uploadProductImages = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        // 10MB / ảnh
        fileSize: 10 * 1024 * 1024,
        // giới hạn số field để tránh abuse
        fields: 50,
        files: 10,
    },
});
