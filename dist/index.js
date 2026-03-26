"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router_1 = __importDefault(require("./auth_user/router"));
const productRouter_1 = __importDefault(require("./product/productRouter"));
const cartRouter_1 = __importDefault(require("./cart/cartRouter"));
const orderRouter_1 = __importDefault(require("./order/orderRouter"));
const notificationRouter_1 = __importDefault(require("./notification/notificationRouter"));
const router = express_1.default.Router();
router.use("/user", router_1.default);
router.use("/product", productRouter_1.default);
router.use("/cart", cartRouter_1.default);
router.use("/order", orderRouter_1.default);
router.use("/notification", notificationRouter_1.default);
exports.default = router;
