import { configDotenv } from "dotenv";
import Redis from "ioredis"
configDotenv()

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
// await redis.set('foo', 'bar');