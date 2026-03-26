"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.listAddresses = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const addressModel_1 = __importDefault(require("../model/addressModel"));
const getUserId = (req) => typeof req.user === "string" ? req.user : req.user?.userId;
const paramId = (req) => {
    const raw = req.params.id;
    if (Array.isArray(raw))
        return raw[0];
    return raw;
};
const requireFields = (body) => {
    const province = typeof body.province === "string" ? body.province.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const ward = typeof body.ward === "string" ? body.ward.trim() : "";
    const detailAddress = typeof body.detailAddress === "string" ? body.detailAddress.trim() : "";
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!province || !city || !ward || !detailAddress) {
        return {
            ok: false,
            message: "Thiếu thông tin: province (tỉnh/TP), city (quận/huyện), ward (xã/phường), detailAddress (địa chỉ cụ thể)",
        };
    }
    return { ok: true, data: { province, city, ward, detailAddress, label: label || undefined } };
};
const listAddresses = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const list = await addressModel_1.default.find({ userId }).sort({ isDefault: -1, updatedAt: -1 });
        return res.status(200).json(list);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.listAddresses = listAddresses;
const createAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const parsed = requireFields(req.body);
        if (!parsed.ok) {
            return res.status(400).json({ message: parsed.message });
        }
        const { province, city, ward, detailAddress, label } = parsed.data;
        const isDefault = Boolean(req.body.isDefault);
        if (isDefault) {
            await addressModel_1.default.updateMany({ userId }, { $set: { isDefault: false } });
        }
        const doc = await addressModel_1.default.create({
            userId,
            province,
            city,
            ward,
            detailAddress,
            label: label ?? "",
            isDefault,
        });
        return res.status(201).json(doc);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.createAddress = createAddress;
const updateAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const id = paramId(req);
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "id không hợp lệ" });
        }
        const existing = await addressModel_1.default.findOne({ _id: id, userId });
        if (!existing) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ" });
        }
        const pick = (key, prev) => {
            if (!(key in req.body))
                return prev;
            const v = req.body[key];
            return typeof v === "string" ? v.trim() : prev;
        };
        const province = pick("province", existing.province);
        const city = pick("city", existing.city);
        const ward = pick("ward", existing.ward);
        const detailAddress = pick("detailAddress", existing.detailAddress);
        const label = "label" in req.body && typeof req.body.label === "string"
            ? req.body.label.trim()
            : existing.label;
        const parsed = requireFields({ province, city, ward, detailAddress });
        if (!parsed.ok) {
            return res.status(400).json({ message: parsed.message });
        }
        const isDefault = req.body.isDefault === undefined ? existing.isDefault : Boolean(req.body.isDefault);
        if (isDefault) {
            await addressModel_1.default.updateMany({ userId, _id: { $ne: id } }, { $set: { isDefault: false } });
        }
        const updated = await addressModel_1.default.findByIdAndUpdate(id, {
            province: parsed.data.province,
            city: parsed.data.city,
            ward: parsed.data.ward,
            detailAddress: parsed.data.detailAddress,
            label,
            isDefault,
        }, { new: true });
        return res.status(200).json(updated);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.updateAddress = updateAddress;
const deleteAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const id = paramId(req);
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "id không hợp lệ" });
        }
        const deleted = await addressModel_1.default.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ" });
        }
        return res.status(200).json({ message: "Đã xóa địa chỉ" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.deleteAddress = deleteAddress;
const setDefaultAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const id = paramId(req);
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "id không hợp lệ" });
        }
        const target = await addressModel_1.default.findOne({ _id: id, userId });
        if (!target) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ" });
        }
        await addressModel_1.default.updateMany({ userId }, { $set: { isDefault: false } });
        target.isDefault = true;
        await target.save();
        return res.status(200).json(target);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.setDefaultAddress = setDefaultAddress;
