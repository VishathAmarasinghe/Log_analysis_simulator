import Redis from "ioredis";
import config from "../config/config";

let redis: Redis | null = null;
let isConnected = false;

export function initRedis(): void {
  if (!config.streaming.redis.enabled) return;
  
  redis = new Redis({
    host: config.streaming.redis.host,
    port: config.streaming.redis.port,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3
  });
  
  redis.on("connect", () => {
    isConnected = true;
    console.log(`Redis connected to ${config.streaming.redis.host}:${config.streaming.redis.port}`);
  });
  
  redis.on("error", (error) => {
    console.error("ERROR: Redis connection error:", error.message);
    console.error("       Make sure Redis is running on", `${config.streaming.redis.host}:${config.streaming.redis.port}`);
    isConnected = false;
  });
  
  redis.on("close", () => {
    isConnected = false;
    console.log("Redis connection closed");
  });
}

export async function sendToRedis(logType: string, logData: any): Promise<void> {
  if (!redis || !isConnected) return;
  
  try {
    const message = JSON.stringify({
      log_type: logType,
      timestamp: new Date().toISOString(),
      data: logData
    });
    
    // Add to Redis Stream with automatic trimming
    await redis.xadd(
      config.streaming.redis.stream,
      "MAXLEN",
      "~", // Approximate trimming (more efficient)
      config.streaming.redis.maxLen.toString(),
      "*", // Auto-generate ID
      "message",
      message
    );
  } catch (error) {
    console.error("Failed to send to Redis:", error);
  }
}

export function closeRedis(): void {
  if (redis) {
    redis.disconnect();
    isConnected = false;
    console.log("Redis disconnected");
  }
}

export function isRedisConnected(): boolean {
  return isConnected;
}

