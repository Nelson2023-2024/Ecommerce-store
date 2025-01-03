import { configDotenv } from "dotenv";
import express from "express";
import { authRoutes } from "./routes/auth.route.js";
import { productRoutes } from "./routes/product.route.js";
import { cartRoutes } from "./routes/cart.route.js";
import { couponRoutes } from "./routes/coupon.route.js";
import { connectToMongoDB } from "./db/db.js";
import cookieParser from "cookie-parser";
import { paymentRoutes } from "./routes/payment.route.js";
configDotenv();
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectToMongoDB();
});
