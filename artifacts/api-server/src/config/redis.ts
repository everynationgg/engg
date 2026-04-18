import Redis from "ioredis";
import { logger } from "../lib/logger.js";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";

function createClient(purpose: "main" | "pub" | "sub"): Redis {
  const client = new Redis(REDIS_URL, {
    lazyConnect: false,
    // Exponential back-off: `times` starts at 0 on the first retry attempt.
    // `100 * 2 ** times` gives 100 ms → 200 ms → 400 ms → … capped at 10 s.
    retryStrategy: (times) => Math.min(100 * 2 ** times, 10_000),
    maxRetriesPerRequest: null, // let retryStrategy handle it
    enableReadyCheck: true,
  });

  client.on("connect", () => logger.info({ purpose }, "Redis connecting"));
  client.on("ready", () => logger.info({ purpose }, "Redis ready"));
  client.on("error", (err: Error) => logger.error({ purpose, err }, "Redis error"));
  client.on("close", () => logger.warn({ purpose }, "Redis connection closed"));
  client.on("reconnecting", () => logger.info({ purpose }, "Redis reconnecting"));

  return client;
}

// Shared client for general key/value and Lua scripts
export const redisClient = createClient("main");

// Dedicated pub/sub pair required by @socket.io/redis-adapter
export const redisPub = createClient("pub");
export const redisSub = createClient("sub");
