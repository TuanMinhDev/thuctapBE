"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../auth_user/middleware");
const addressController_1 = require("./controller/addressController");
const addressRouter = express_1.default.Router();
addressRouter.get("/", (0, middleware_1.checkPermission)(["admin", "user"]), addressController_1.listAddresses);
addressRouter.post("/", (0, middleware_1.checkPermission)(["admin", "user"]), addressController_1.createAddress);
addressRouter.put("/:id", (0, middleware_1.checkPermission)(["admin", "user"]), addressController_1.updateAddress);
addressRouter.delete("/:id", (0, middleware_1.checkPermission)(["admin", "user"]), addressController_1.deleteAddress);
addressRouter.patch("/:id/default", (0, middleware_1.checkPermission)(["admin", "user"]), addressController_1.setDefaultAddress);
exports.default = addressRouter;
