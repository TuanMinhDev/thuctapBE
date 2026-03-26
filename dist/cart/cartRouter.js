"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../auth_user/middleware");
const cartController_1 = require("./controller/cartController");
const cartRouter = express_1.default.Router();
cartRouter.post("/create", (0, middleware_1.checkPermission)(["admin", "user"]), cartController_1.createCart);
cartRouter.get("/get", (0, middleware_1.checkPermission)(["admin", "user"]), cartController_1.getCart);
cartRouter.delete("/delete", (0, middleware_1.checkPermission)(["admin", "user"]), cartController_1.deleteProductCart);
cartRouter.put("/update/:id/:itemId", (0, middleware_1.checkPermission)(["admin", "user"]), cartController_1.updateQuantityProductCart);
exports.default = cartRouter;
