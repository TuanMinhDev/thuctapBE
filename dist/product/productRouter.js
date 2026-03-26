"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("./controller/productController");
const middleware_1 = require("../auth_user/middleware");
const middleware_2 = require("./middleware");
const productRouter = express_1.default.Router();
// Chỉ admin mới được tạo / sửa / xoá sản phẩm
productRouter.post("/create", (0, middleware_1.checkPermission)(["admin"]), middleware_2.uploadProductImages.array("images", 10), productController_1.createProduct);
productRouter.get("/get", productController_1.getProduct);
productRouter.get("/get/:id", productController_1.getProductById);
productRouter.put("/update/:id", (0, middleware_1.checkPermission)(["admin"]), middleware_2.uploadProductImages.array("images", 10), productController_1.updateProduct);
productRouter.delete("/delete/:id", (0, middleware_1.checkPermission)(["admin"]), productController_1.deleteProduct);
exports.default = productRouter;
