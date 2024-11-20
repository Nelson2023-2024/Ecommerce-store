import { Router } from "express";
import { redis } from "../db/redis.js";
import { Product } from "../models/product.model.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

//eveone access this route even when not logged in
router.get("/featured", async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");

    //if the featured products are found display them
    if(featuredProducts) return res.status(200).json(JSON.parse(featuredProducts))

    //if not in redis fetch it from MONGODB
    //.lean() is gonna return plain js object instead on MongoDb documnent which is good for perfomance
    featuredProducts = await Product.find({isFeatured: true}).lean()

    if(!featuredProducts) return res.status(404).json({message: "No featured product found"})

    //if there is update our caches as well sore in redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts))

    res.status(200).json(featuredProducts)

  } catch (error) {
    console.log("Error in featured route", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
});

router.use(protectRoute, adminRoute);

router.get("/", async (req, res) => {
  try {
    //get all products
    const products = await Product.find({});
    res.status(200).json({ products });
  } catch (error) {
    console.log("Error in getallproducts route", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
});

export { router as productRoutes };
