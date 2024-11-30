import { configDotenv } from "dotenv";
import Stripe from "stripe";
import { Coupon } from "../../models/coupon.model.js";
configDotenv();

//with this we can creatsessions and discounts etc
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//create 1 time used coupon
export async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id; //so that stripe can use it
}


export async function createNewCoupon (userId) {
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2,8).toUpperCase(),
        discountPercentage:10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),//30 days from now
        userId: userId
    })

    await newCoupon.save()

    return newCoupon
}