"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../auth_user/middleware");
const orderController_1 = require("./controller/orderController");
const orderRouter = express_1.default.Router();
orderRouter.post("/create", (0, middleware_1.checkPermission)(["admin", "user"]), orderController_1.createOrder);
orderRouter.get("/get", (0, middleware_1.checkPermission)(["admin", "user"]), orderController_1.getOrder);
orderRouter.put("/:id/status", (0, middleware_1.checkPermission)(["admin"]), orderController_1.updateStatusOrder);
orderRouter.delete("/:id", (0, middleware_1.checkPermission)(["admin"]), orderController_1.deleteOrder);
exports.default = orderRouter;
