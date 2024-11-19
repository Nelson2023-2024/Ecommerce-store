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
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "Email doesn't exist" });

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);

      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        user: {
          ...user._doc, //retun the whole user document
          password: undefined, //keep the password field undefined
        },
        message: `${email} Loggedin successfully`,
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in the login route", error.message);
    res.status(500).json({ error: "Internal Server error" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    // Log the cookies received
    console.log("Cookies received:", req.cookies);

    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        console.log(`Decoded userId: ${decoded.userId}`);

        // Construct the Redis key
        const redisKey = `refresh_token:${decoded.userId}`;
        console.log(`Redis Key: ${redisKey}`);

        // Check if the refresh token exists in Redis
        const tokenExists = await redis.exists(redisKey);
        console.log(`Token exists: ${tokenExists}`);

        if (tokenExists) {
          // Delete the refresh token from Redis
          await redis.del(redisKey);
          console.log("Refresh token deleted from Redis");
        } else {
          console.log("Refresh token not found in Redis");
        }
      } catch (verifyError) {
        console.log("Error verifying refresh token:", verifyError.message);
      }
    } else {
      console.log("No refresh token found in cookies");
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    console.log("Cookies cleared");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout route:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

//this will refesh the access token
router.post("/refresh-token", async (req, res) => {
  try {
    //if the access token expires user creates a new one by providing a refreshtoken
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "No refresh Token Provided" });

    //if the reresh tken exists
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    //check if it matches what we have in our redis DB
    const storedRefteshToken = await redis.get(
      `refresh_token:${decoded.userId}`
    );

    //user is trying to cheat us
    if (storedRefteshToken !== refreshToken)
      return res.status(401).json({ message: "Invalid refresh token" });

    //if the refresh token match generate a new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    //create the cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // prevent XSS attacks
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // prevent CSRF
      maxAge: 15 * 60 * 1000, // 15 minutesf
    });

    res.status(201).json({ message: "Access token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    res
      .status(500)
      .json({ message: "Internal server Error", error: error.message });
  }
});

export { router as authRoutes };

// user: {
//         ...user._doc, //retun the whole user document
//         password: undefined //keep the password field undefined
//       }
