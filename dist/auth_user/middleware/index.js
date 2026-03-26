"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkId = exports.checkPermission = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const getAccessTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.length > 0)
        return authHeader;
    const legacyHeader = req.headers.token;
    if (typeof legacyHeader === "string" && legacyHeader.length > 0)
        return legacyHeader;
    return undefined;
};
const verifyToken = (req, res, next) => {
    const tokenValue = getAccessTokenFromRequest(req);
    if (!tokenValue) {
        return res.status(401).json({ message: "Thiếu token" });
    }
    if (!JWT_SECRET) {
        return res.status(500).json({ message: "Thiếu JWT_SECRET" });
    }
    const accessToken = tokenValue.startsWith("Bearer ") ? tokenValue.slice(7) : tokenValue;
    jsonwebtoken_1.default.verify(accessToken, JWT_SECRET, (err, decoded) => {
        if (err || !decoded) {
            return res.status(401).json({ message: "Token không hợp lệ" });
        }
        const payload = decoded;
        if (!payload.userId || !payload.role) {
            return res.status(401).json({ message: "Token thiếu thông tin" });
        }
        req.user = payload;
        next();
    });
};
exports.verifyToken = verifyToken;
const checkPermission = (roles) => {
    return (req, res, next) => {
        (0, exports.verifyToken)(req, res, () => {
            if (req.user && roles.includes(req.user.role)) {
                req.user.id = req.user.userId;
                next();
            }
            else {
                return res.status(403).json({ message: "Bạn không có quyền truy cập" });
            }
        });
    };
};
exports.checkPermission = checkPermission;
const checkId = () => {
    return (req, res, next) => {
        (0, exports.verifyToken)(req, res, () => {
            const paramId = req.params.id;
            const userId = req.user?.userId;
            if (!paramId) {
                return res.status(400).json({ message: "Thiếu id" });
            }
            if (!userId) {
                return res.status(401).json({ message: "Chưa xác thực" });
            }
            if (userId === paramId) {
                return next();
            }
            return res.status(403).json({ message: "Bạn không có quyền truy cập" });
        });
    };
};
exports.checkId = checkId;
