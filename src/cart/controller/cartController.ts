import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../model/cartModel";
import Product from "../../product/model/productModel";

type AuthedRequest = Request & { user?: { userId?: string; id?: string; role?: string } };

export const createCart = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Chưa xác thực" });
    }

    const { items, status } = req.body as {
      items?: {
        productId: string;
        variant: { color: string; size: string };
        quantity: number;
      }[];
      status?: "active" | "inactive";
    };

    let processedItemsData: {
      productId: string;
      variant: { color: string; size: string };
      quantity: number;
    }[] = [];

    if (req.body.productId && req.body.variant && req.body.quantity) {
      processedItemsData = [{
        productId: req.body.productId,
        variant: req.body.variant,
        quantity: req.body.quantity
      }];
    } else if (Array.isArray(items) && items.length > 0) {
      processedItemsData = items;
    } else {
      return res.status(400).json({ 
        message: "Cần có productId, variant, quantity (cho 1 item) hoặc items array (cho nhiều items)" 
      });
    }
    const processedItems = [];
    
    for (const item of processedItemsData) {
      
      if (!item.productId || !item.variant || !item.variant.color || !item.variant.size) {
        return res.status(400).json({ message: "Mỗi item phải có productId, variant.color, variant.size" });
      }
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ message: `productId không hợp lệ: ${item.productId}` });
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return res.status(400).json({ message: "quantity phải là số > 0" });
      }

      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${item.productId}` });
      }

      
      const variant = product.variants.find(
        v => v.color === item.variant.color && v.size === item.variant.size
      );
      
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
    let cart = await Cart.findOne({ userId, status: status ?? "active" });
    if (cart) {
      for (const newItem of processedItems) {
        const existingItemIndex = cart.items.findIndex(
          (item: any) => 
            item.productId.toString() === newItem.productId && 
            item.variant.color === newItem.variant.color && 
            item.variant.size === newItem.variant.size
        );
        
        if (existingItemIndex >= 0) {
          cart.items[existingItemIndex].quantity += newItem.quantity;
        } else {
          cart.items.push(newItem);
        }
      }
      
      cart.totalPrice = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      await cart.save();
    } else {
      cart = await Cart.create({
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
  } catch (error: any) {
    
    return res.status(500).json({ message: error?.message || "Lỗi server" });
  }
};

export const getCart = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa xác thực" });

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    return res.status(200).json({ message: "Lấy giỏ hàng thành công", cart });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Lỗi server" });
  }
};


export const deleteProductCart = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa xác thực" });

    const { itemIds } = req.body as { itemIds?: string[] };
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: "itemIds phải là mảng và không được rỗng" });
    }
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
    const beforeLen = cart.items.length;
    cart.items = cart.items.filter((item: any) => !itemIds.includes(item._id.toString())) as any;
    if (cart.items.length === beforeLen) {
      return res.status(404).json({ message: "Các items không có trong giỏ hàng" });
    }
    cart.totalPrice = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    await cart.save();
    return res.status(200).json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công", cart });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Lỗi server" });
  }
};

export const updateQuantityProductCart = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Chưa xác thực" });

    const cartId = req.params.id as string;
    const itemId = req.params.itemId as string;
    
    if (!cartId) return res.status(400).json({ message: "Thiếu cartId" });
    if (!itemId) return res.status(400).json({ message: "Thiếu itemId" });
    
    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({ message: "cartId không hợp lệ" });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "itemId không hợp lệ" });
    }

    const { quantity } = req.body as { quantity?: number };
    if (typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({ message: "quantity phải là số > 0" });
    }

    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    // Ownership check
    if (cart.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    // Find the specific item in the cart
    const itemIndex = cart.items.findIndex((item: any) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }

    // Update quantity of the specific item
    cart.items[itemIndex].quantity = quantity;

    // Recalculate total price
    cart.totalPrice = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    await cart.save();

    return res.status(200).json({ message: "Cập nhật số lượng thành công", cart });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Lỗi server" });
  }
};
