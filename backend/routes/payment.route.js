import { Router } from "express";
import { productRoutes } from "./product.route.js";
import { Coupon } from "../models/coupon.model.js";
import {
  createNewCoupon,
  createStripeCoupon,
  stripe,
} from "../db/lib/stripe.js";

const router = Router();

router.use(productRoutes);

//createCheckoutSession
router.post("/create-checkout-session", async (req, res) => {
  //get products that user sent us and create session
  try {
    const { products, couponCode } = req.body;

    //check if the products is i array format
    if (!Array.isArray(products) || products.length === 0)
      return res.status(400).json({ error: "Invalid or empty products array" });

    //calculate total amount
    let totalAmount = 0;

    //items(products)
    const items = products.map((product) => {
      const amount = Math.round(product.price * 100); //stipe wants the amount to be sent in cents e.g cents => $10 * 100 = 1000

      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
      };
    });

    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      //if there is a valid coupon in the DB abd is active
      if (coupon) {
        totalAmount = Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        ); // format of cents
      }

      //create session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items,
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`, //stripe will put the actual sessionid
        cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
        discounts: coupon
          ? [
              {
                coupon: await createStripeCoupon(coupon.discountPercentage),
              },
            ]
          : [],
        //fields that can be extracted from the session
        metadata: {
          userId: req.user._id.toString(),
          couponCode: couponCode || "",
        },
      });
    }

    //if $200 create the coupon for next purchase for 10% off
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {}
});
export { router as paymentRoutes };
