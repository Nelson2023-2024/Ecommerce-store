import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute);

//get all products in cart
router.get("/", async (req, res) => {});

//addToCart
router.post("/", async (req, res) => {
  try {
    const { productId } = req.body;

    //get the autheniticated user
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);

    //if the item exists increments the number
    if (existingItem) existingItem.quantity = +1;
    //if it doesn't exist push it's id to cartItems array
    else user.cartItems.push(productId);

    await user.save();

    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log(`Error in addToCart router`, error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

//removeallfromcart
router.delete("/", async (req, res) => {});

//update quantity
router.put("/", async (req, res) => {});

export { router as cartRoutes };
