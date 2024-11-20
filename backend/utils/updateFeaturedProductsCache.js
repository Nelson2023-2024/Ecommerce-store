import { redis } from "../db/redis.js";
import { Product } from "../models/product.model.js";

export const updateFeaturedProductsCache = async (params) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("Error in updateFeaturedProductsCache function ", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
};
