"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getAllUser = exports.updateInfoUser = exports.getMe = void 0;
const userModel_1 = __importDefault(require("../model/userModel"));
const getMe = async (req, res) => {
    try {
        const userId = typeof req.user === "string" ? req.user : req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const user = await userModel_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        return res.status(500).json({ message: "Lỗi server", error });
    }
};
exports.getMe = getMe;
const updateInfoUser = async (req, res) => {
    try {
        const userId = typeof req.user === "string" ? req.user : req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const { name, email, address, phoneNumber } = req.body;
        if (!name || !email || !address || !phoneNumber) {
            return res.status(400).json({ message: "Chưa nhập đầy đủ dữ liệu" });
        }
        const checkEmail = await userModel_1.default.findOne({ email, _id: { $ne: userId } });
        if (checkEmail) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }
        const checkPhoneNumber = await userModel_1.default.findOne({ phoneNumber, _id: { $ne: userId } });
        if (checkPhoneNumber) {
            return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
        }
        const updatedUser = await userModel_1.default.findByIdAndUpdate(userId, { name, email, address, phoneNumber }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }
        return res.status(200).json({ message: "Cập nhật thành công" });
    }
    catch (error) {
        return res.status(500).json({ message: "Lỗi server", error });
    }
};
exports.updateInfoUser = updateInfoUser;
const getAllUser = async (req, res) => {
    try {
        const users = await userModel_1.default.find();
        return res.status(200).json(users);
    }
    catch (error) {
        return res.status(500).json({ message: "Lỗi server", error });
    }
};
exports.getAllUser = getAllUser;
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: "Thiếu id" });
        }
        const user = await userModel_1.default.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }
        return res.status(200).json({ message: "Xóa user thành công" });
    }
    catch (error) {
        return res.status(500).json({ message: "Lỗi server", error });
    }
};
exports.deleteUser = deleteUser;
