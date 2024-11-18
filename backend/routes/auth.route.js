import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { generateTokens, setCookies } from "../utils/generateTokens.js";
import { storeRefreshToken } from "../utils/storeRefreshToken.js";
import { redis } from "../db/redis.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name)
      return res.status(400).json({ error: "All fields are required" });

    const userExists = await User.findOne({ email });

    if (userExists)
      return res.status(400).json({ error: "Email already taken" });

    //if the email is not taken
    const user = await User.create({ name, email, password });

    console.log(user);

    //authenticate

    //generate the tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    //store refresh token to DB
    await storeRefreshToken(user._id, refreshToken);

    //setcookies
    setCookies(res, accessToken, refreshToken);

    console.log(`accessToken:${accessToken}`);
    console.log(`refreshToken:${refreshToken}`);

    res.status(201).json({
      user: {
        ...user._doc, //retun the whole user document
        password: undefined, //keep the password field undefined
      },
      message: `${email} created successfully`,
    });
  } catch (error) {
    console.log("Error in the signup route", error.message);
    res.status(500).json({ error: "Internal Server error" });
  }
});
router.get("/login", async (req, res) => {});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshtoken;

    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      console.log(decoded);
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie("accesstoken");
    res.clearCookie("refreshtoken");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

export { router as authRoutes };

// user: {
//         ...user._doc, //retun the whole user document
//         password: undefined //keep the password field undefined
//       }
