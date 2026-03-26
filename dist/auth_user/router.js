"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("./controller/authController");
const userController_1 = require("./controller/userController");
const index_1 = require("./middleware/index");
const userRouter = express_1.default.Router();
userRouter.post("/register", authController_1.register);
userRouter.post("/login", authController_1.login);
userRouter.get("/me", (0, index_1.checkPermission)(["admin", "user"]), userController_1.getMe);
userRouter.put("/update-info", (0, index_1.checkPermission)(["admin", "user"]), userController_1.updateInfoUser);
userRouter.get("/all", (0, index_1.checkPermission)(["admin"]), userController_1.getAllUser);
userRouter.delete("/delete/:id", (0, index_1.checkPermission)(["admin"]), userController_1.deleteUser);
userRouter.post("/change-password", (0, index_1.checkPermission)(["admin", "user"]), authController_1.changePassword);
userRouter.post("/refresh-token", authController_1.refreshToken);
exports.default = userRouter;
