import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const protectRoute = async (req, res, next) => {
  try {
    console.log("Inside Protect route")
    console.log("Cookies:", req.cookies);

    const accessToken = req.cookies?.accessToken;

    if (!accessToken)
      return res
        .status(401)
        .json({ message: "Unathirized - no access token provided" });

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.status(401).json({ message: "User not found" });

    //if the user exists
    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protect route middleware", error, message);
    res.status(500).json({ message: "Unauthorized  - invalid access token" });
  }
};

export const adminRoute = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - admin only" });
  }
};
