"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ["pants", "shirt", "shoes", "sandals", "hat", "jewelry"],
        required: true,
    },
    sale: {
        type: Number,
        default: null,
        min: 0,
    },
    variants: [{
            color: String,
            size: String,
            stock: Number,
            sold: Number,
            price: Number,
        }],
    images: {
        type: [String],
        default: [],
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
