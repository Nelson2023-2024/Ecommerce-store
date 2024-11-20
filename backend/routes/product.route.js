import { Router } from "express";
import { redis } from "../db/redis.js";
import { Product } from "../models/product.model.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import cloudinary from "../db/cloudinary.js";

const router = Router();

//eveone access this route even when not logged in
router.get("/featured", async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");

    //if the featured products are found display them
    if (featuredProducts)
      return res.status(200).json(JSON.parse(featuredProducts));

    //if not in redis fetch it from MONGODB
    //.lean() is gonna return plain js object instead on MongoDb documnent which is good for perfomance
    featuredProducts = await Product.find({ isFeatured: true }).lean();

    if (!featuredProducts)
      return res.status(404).json({ message: "No featured product found" });

    //if there is update our caches as well sore in redis for future quick access
    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.status(200).json(featuredProducts);
  } catch (error) {
    console.log("Error in featured route", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
});

router.get("/recommendations", async (req, res) => {
  try {
    //find 3 different products randomly
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      // for the 3 products populate the below
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
    res.status(200).json(products);
  } catch (error) {
    console.log("Error in recommendations route", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
});

router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    //find products where cegories is = to the params
    const products = await Product.find({ category });

    res.status(200).json(products);
  } catch (error) {
    console.log("Error in category route", error.message);
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

router.post("/create-product", async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;

    if (image) {
      //upload the image and put it into a folder called products
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse?.secure_url
        : "",
      price,
      category,
    });

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in create-product route", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "product not found" });
    // if the product is found

    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0]; // get id of the image so that we can delete it

      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("deleted image form cloudinary");
      } catch (error) {
        console.log("Error deleting image from cloudinary", error.message);
      }
    }

    //delete it from DB
    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteproduct route", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
});

export { router as productRoutes };
