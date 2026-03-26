"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.getProductById = exports.updateProduct = exports.getProduct = exports.createProduct = void 0;
const productModel_1 = __importDefault(require("../model/productModel"));
const cloudinary_1 = require("cloudinary");
const notificationService_1 = require("../../notification/services/notificationService");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: "products" }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve(result.secure_url);
        });
        uploadStream.end(file.buffer);
    });
};
const createProduct = async (req, res) => {
    try {
        const { name, description, category, sale, variants } = req.body;
        let parsedVariants = variants;
        if (typeof variants === 'string') {
            try {
                parsedVariants = JSON.parse(variants);
            }
            catch (error) {
                return res.status(400).json({ message: "variants phải là JSON hợp lệ" });
            }
        }
        if (!name || !description || !category || !parsedVariants) {
            return res.status(400).json({ message: "Thiếu thông tin sản phẩm bắt buộc (name, description, category, variants)" });
        }
        if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
            return res.status(400).json({ message: "variants phải là mảng và không được rỗng" });
        }
        for (const variant of parsedVariants) {
            if (!variant.color || !variant.size || variant.stock === undefined || variant.sold === undefined || variant.price === undefined) {
                return res.status(400).json({ message: "Mỗi variant phải có color, size, stock, sold, price" });
            }
            if (typeof variant.stock !== 'number' || variant.stock < 0) {
                return res.status(400).json({ message: "stock phải là số >= 0" });
            }
            if (typeof variant.sold !== 'number' || variant.sold < 0) {
                return res.status(400).json({ message: "sold phải là số >= 0" });
            }
            if (typeof variant.price !== 'number' || variant.price <= 0) {
                return res.status(400).json({ message: "price phải là số > 0" });
            }
        }
        const files = req.files ?? [];
        const imageUrls = await Promise.all(files.map(uploadToCloudinary));
        const newProduct = new productModel_1.default({
            name,
            description,
            category,
            sale: sale !== undefined ? Number(sale) : null,
            variants: parsedVariants.map((v) => ({
                color: v.color,
                size: v.size,
                stock: Number(v.stock),
                sold: Number(v.sold),
                price: Number(v.price)
            })),
            images: imageUrls,
        });
        await newProduct.save();
        let notificationBroadcast = null;
        try {
            notificationBroadcast = await (0, notificationService_1.notifyAllUsersNewProduct)(newProduct._id, name, imageUrls[0] ?? "");
        }
        catch (err) {
            console.error("[createProduct] notifyAllUsersNewProduct failed:", err);
        }
        return res.status(201).json({
            message: "Tạo sản phẩm thành công",
            product: newProduct,
            notificationBroadcast,
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.createProduct = createProduct;
const getProduct = async (req, res) => {
    try {
        const { name, category, minPrice, maxPrice, onSale, color, size, pageNumber, pageSize } = req.query;
        const filter = {};
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }
        if (category) {
            filter.category = { $regex: category, $options: "i" };
        }
        if (minPrice || maxPrice) {
            const priceFilter = {};
            if (minPrice)
                priceFilter.$gte = Number(minPrice);
            if (maxPrice)
                priceFilter.$lte = Number(maxPrice);
            filter["variants.price"] = priceFilter;
        }
        if (color) {
            filter["variants.color"] = { $regex: color, $options: "i" };
        }
        if (size) {
            filter["variants.size"] = { $regex: size, $options: "i" };
        }
        if (onSale === "true") {
            filter.sale = { $ne: null };
        }
        const page = Number(pageNumber) || 1;
        const limit = Number(pageSize) || 10;
        const skip = (page - 1) * limit;
        const products = await productModel_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await productModel_1.default.countDocuments(filter);
        return res.status(200).json({
            count: products.length,
            total,
            page,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
            products,
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getProduct = getProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, sale, variants } = req.body;
        // Parse variants if it's a string (from form-data)
        let parsedVariants = variants;
        if (typeof variants === 'string') {
            try {
                parsedVariants = JSON.parse(variants);
            }
            catch (error) {
                return res.status(400).json({ message: "variants phải là JSON hợp lệ" });
            }
        }
        const product = await productModel_1.default.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        // Validate variants if provided
        if (parsedVariants !== undefined) {
            if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
                return res.status(400).json({ message: "variants phải là mảng và không được rỗng" });
            }
            for (const variant of parsedVariants) {
                if (!variant.color || !variant.size || variant.stock === undefined || variant.sold === undefined || variant.price === undefined) {
                    return res.status(400).json({ message: "Mỗi variant phải có color, size, stock, sold, price" });
                }
                if (typeof variant.stock !== 'number' || variant.stock < 0) {
                    return res.status(400).json({ message: "stock phải là số >= 0" });
                }
                if (typeof variant.sold !== 'number' || variant.sold < 0) {
                    return res.status(400).json({ message: "sold phải là số >= 0" });
                }
                if (typeof variant.price !== 'number' || variant.price <= 0) {
                    return res.status(400).json({ message: "price phải là số > 0" });
                }
            }
        }
        // Upload ảnh mới nếu có rồi ghép với ảnh cũ
        const files = req.files ?? [];
        let updatedImages = product.images ?? [];
        if (files.length > 0) {
            const newUrls = await Promise.all(files.map(uploadToCloudinary));
            updatedImages = [...updatedImages, ...newUrls];
        }
        // Hỗ trợ xoá ảnh cụ thể: truyền removeImages = ["url1", "url2"]
        const { removeImages } = req.body;
        if (removeImages) {
            const toRemove = typeof removeImages === "string" ? JSON.parse(removeImages) : removeImages;
            updatedImages = updatedImages.filter((img) => !toRemove.includes(img));
        }
        const updateData = {
            name: name ?? product.name,
            description: description ?? product.description,
            category: category ?? product.category,
            sale: sale !== undefined ? (sale === "null" || sale === null ? null : Number(sale)) : product.sale,
            images: updatedImages,
        };
        if (parsedVariants !== undefined) {
            updateData.variants = parsedVariants.map((v) => ({
                color: v.color,
                size: v.size,
                stock: Number(v.stock),
                sold: Number(v.sold),
                price: Number(v.price)
            }));
        }
        const updatedProduct = await productModel_1.default.findByIdAndUpdate(id, updateData, { new: true });
        return res.status(200).json({ message: "Cập nhật sản phẩm thành công", product: updatedProduct });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.updateProduct = updateProduct;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productModel_1.default.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        return res.status(200).json({ product });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getProductById = getProductById;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productModel_1.default.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        return res.status(200).json({ message: "Xóa sản phẩm thành công" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.deleteProduct = deleteProduct;
