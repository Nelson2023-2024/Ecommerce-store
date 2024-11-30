import { configDotenv } from "dotenv";
import Stripe from "stripe";
configDotenv()

//with this we can creatsessions and discounts etc
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)