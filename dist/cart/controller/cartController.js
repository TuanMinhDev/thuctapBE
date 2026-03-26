"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuantityProductCart = exports.deleteProductCart = exports.getCart = exports.createCart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cartModel_1 = __importDefault(require("../model/cartModel"));
const productModel_1 = __importDefault(require("../../product/model/productModel"));
const createCart = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Chưa xác thực" });
        }
        const { items, status } = req.body;
        let processedItemsData = [];
        if (req.body.productId && req.body.variant && req.body.quantity) {
            processedItemsData = [{
                    productId: req.body.productId,
                    variant: req.body.variant,
                    quantity: req.body.quantity
                }];
        }
        else if (Array.isArray(items) && items.length > 0) {
            processedItemsData = items;
        }
        else {
            return res.status(400).json({
                message: "Cần có productId, variant, quantity (cho 1 item) hoặc items array (cho nhiều items)"
            });
        }
        const processedItems = [];
        for (const item of processedItemsData) {
            if (!item.productId || !item.variant || !item.variant.color || !item.variant.size) {
                return res.status(400).json({ message: "Mỗi item phải có productId, variant.color, variant.size" });
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(item.productId)) {
                return res.status(400).json({ message: `productId không hợp lệ: ${item.productId}` });
            }
            if (typeof item.quantity !== "number" || item.quantity <= 0) {
                return res.status(400).json({ message: "quantity phải là số > 0" });
            }
            const product = await productModel_1.default.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${item.productId}` });
            }
            const variant = product.variants.find(v => v.color === item.variant.color && v.size === item.variant.size);
            if (!variant) {
                return res.status(404).json({ message: `Không tìm thấy variant ${item.variant.color} - ${item.variant.size} cho sản phẩm ${item.productId}` });
            }
            let finalPrice = variant.price || 0;
            if (product.sale && product.sale > 0 && variant.price) {
                finalPrice = variant.price * (1 - product.sale / 100);
            }
            const processedItem = {
                productId: item.productId,
                variant: item.variant,
                quantity: item.quantity,
                price: finalPrice
            };
            processedItems.push(processedItem);
        }
        const totalPrice = processedItems.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
        let cart = await cartModel_1.default.findOne({ userId, status: status ?? "active" });
        if (cart) {
            for (const newItem of processedItems) {
                const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() === newItem.productId &&
                    item.variant.color === newItem.variant.color &&
                    item.variant.size === newItem.variant.size);
                if (existingItemIndex >= 0) {
                    cart.items[existingItemIndex].quantity += newItem.quantity;
                }
                else {
                    cart.items.push(newItem);
                }
            }
            cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            await cart.save();
        }
        else {
            cart = await cartModel_1.default.create({
                userId,
                items: processedItems,
                totalPrice,
                status: status ?? "active",
            });
        }
        const message = cart.items.length === processedItems.length ?
            "Tạo giỏ hàng thành công" :
            "Thêm sản phẩm vào giỏ hàng thành công";
        return res.status(201).json({ message, cart });
    }
    catch (error) {
        return res.status(500).json({ message: error?.message || "Lỗi server" });
    }
};
exports.createCart = createCart;
const getCart = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Chưa xác thực" });
        const cart = await cartModel_1.default.findOne({ userId }).populate("items.productId");
        if (!cart)
            return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
        return res.status(200).json({ message: "Lấy giỏ hàng thành công", cart });
    }
    catch (error) {
        return res.status(500).json({ message: error?.message || "Lỗi server" });
    }
};
exports.getCart = getCart;
const deleteProductCart = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Chưa xác thực" });
        const { itemIds } = req.body;
        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ message: "itemIds phải là mảng và không được rỗng" });
        }
        const cart = await cartModel_1.default.findOne({ userId });
        if (!cart)
            return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
        const beforeLen = cart.items.length;
        cart.items = cart.items.filter((item) => !itemIds.includes(item._id.toString()));
        if (cart.items.length === beforeLen) {
            return res.status(404).json({ message: "Các items không có trong giỏ hàng" });
        }
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await cart.save();
        return res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công", cart });
    }
    catch (error) {
        return res.status(500).json({ message: error?.message || "Lỗi server" });
    }
};
exports.deleteProductCart = deleteProductCart;
const updateQuantityProductCart = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Chưa xác thực" });
        const cartId = req.params.id;
        const itemId = req.params.itemId;
        if (!cartId)
            return res.status(400).json({ message: "Thiếu cartId" });
        if (!itemId)
            return res.status(400).json({ message: "Thiếu itemId" });
        if (!mongoose_1.default.Types.ObjectId.isValid(cartId)) {
            return res.status(400).json({ message: "cartId không hợp lệ" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "itemId không hợp lệ" });
        }
        const { quantity } = req.body;
        if (typeof quantity !== "number" || quantity <= 0) {
            return res.status(400).json({ message: "quantity phải là số > 0" });
        }
        const cart = await cartModel_1.default.findById(cartId);
        if (!cart)
            return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
        // Ownership check
        if (cart.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập" });
        }
        // Find the specific item in the cart
        const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng" });
        }
        // Update quantity of the specific item
        cart.items[itemIndex].quantity = quantity;
        // Recalculate total price
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await cart.save();
        return res.status(200).json({ message: "Cập nhật số lượng thành công", cart });
    }
    catch (error) {
        return res.status(500).json({ message: error?.message || "Lỗi server" });
    }
};
exports.updateQuantityProductCart = updateQuantityProductCart;
