import { redis } from "../db/redis.js"

export const storeRefreshToken  = async (userId, refreshToken) =>{
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX",7*14*60*60)
}