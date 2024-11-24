import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { Coupon } from "../models/coupon.model.js";

const router = Router();

router.use(protectRoute);

//get the current user coupon
router.get("/", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    console.log("Error in the get current user coupon", error.message);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});

//validate coupon
router.get("/validate-coupon", async (req, res) => {
  try {
    const { code } = req.body;

    //check if the code matched for the user and it is active
    const coupon = await Coupon.findOne({
      code: code,
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    //if the coupon has expired
    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();

      return res.status(400).json({ message: "Coupon expired" });
    }

    //if user passes alll those checks
    res
      .status(200)
      .json({
        message: "Coupon is Valid",
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      });
  } catch (error) {
    console.log("Error in the validate coupon route", error.message);
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});

export { router as couponRoutes };
