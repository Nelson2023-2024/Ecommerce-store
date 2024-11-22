import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { Product } from "../models/product.model.js";

const router = Router();

router.use(protectRoute);

//get all products in cart
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ _id: { $in: req.user.cartItems } });

    //add quantity for each product
    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find(
        (cartItem) => cartItem.id === product.id
      );
      return { ...product.toJSON(), quantity: item.quantity };
    });

    // SIMPLER CODE
    // / Populate the cartItems with product details
    // const userWithCart = await User.findById(req.user._id).populate('cartItems.product');

    // // Format the response to include product details and quantity
    // const cartItems = userWithCart.cartItems.map(item => ({
    //   ...item.product.toJSON(),
    //   quantity: item.quantity,
    // }));

    res.status(200).json(cartItems)
  } catch (error) {
    console.log(`Error in get all products router`, error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

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
router.delete("/", async (req, res) => {
  try {
    const { productId } = req.body;

    //value cames from protectRoute
    const user = req.user;

    if (!productId) user.cartItems = [];
    else
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);

    //save the changes to the DB
    await user.save();
    res.status(200).json(user.cartItems);
  } catch (error) {
    console.log(`Error in removeallfromcart router`, error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

//update quantity
router.put("/:id", async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    //check if the item exists
    const existingItem = user.cartItems.find((item) => item.id === productId);

    if (existingItem) {
      if (quantity === 0) {
        //if decrement reaches 0 delete the product from the cartItems
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);

        await user.save();

        return res.status(200).json(user.cartItems);
      } else {
        existingItem.quantity = quantity;
        await user.save();
        res.status(200).json(user.cartItems);
      }
    } else res.status(404).json({ message: "Product not found" });
  } catch (error) {
    console.log(`Error in update quantity route`, error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export { router as cartRoutes };
