"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const addressSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    /** Tỉnh / Thành phố trực thuộc trung ương */
    province: {
        type: String,
        required: true,
        trim: true,
    },
    /** Quận / Huyện / Thị xã / Thành phố thuộc tỉnh (cấp dưới tỉnh) */
    city: {
        type: String,
        required: true,
        trim: true,
    },
    /** Phường / Xã / Thị trấn */
    ward: {
        type: String,
        required: true,
        trim: true,
    },
    /** Số nhà, tên đường, tòa nhà, ... */
    detailAddress: {
        type: String,
        required: true,
        trim: true,
    },
    label: {
        type: String,
        trim: true,
        default: "",
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
addressSchema.index({ userId: 1, isDefault: 1 });
const Address = mongoose_1.default.model("Address", addressSchema);
exports.default = Address;
