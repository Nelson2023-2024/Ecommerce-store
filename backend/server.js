import { configDotenv } from "dotenv";
import express from "express";
import { authRoutes } from "./routes/auth.route.js";
import { connectToMongoDB } from "./db/db.js";
import cookieParser from "cookie-parser";
configDotenv();
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser())

app.use("/api/auth", authRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectToMongoDB();
});
