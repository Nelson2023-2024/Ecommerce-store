import { Router } from "express";
import { Product } from "../models/product.model.js";

const router = Router();

//getallproducts
router.get("/", async (req, res) => {
  try {
    //get all products
    const products = Product.find({});
    res.status(200).json({ products });
  } catch (error) {
    console.log("Error in getallproducts route", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
});

export { router as productRoutes };
