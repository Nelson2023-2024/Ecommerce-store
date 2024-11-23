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

export { router as couponRoutes };
