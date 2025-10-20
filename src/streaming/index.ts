import { broadcastLog as websocketBroadcast } from "./websocket";
import { sendToKafka } from "./kafka";
import { sendToRedis } from "./redis";
import { storeLog } from "../storage/database";

/**
 * Central function to distribute logs to all enabled streaming channels
 */
export async function distributeLog(logType: "application" | "access", logData: any): Promise<void> {
  const logEntry = {
    log_type: logType,
    timestamp: new Date().toISOString(),
    data: logData
  };
  
  // Send to WebSocket (synchronous)
  websocketBroadcast(logType, logData);
  
  // Send to Kafka (async)
  sendToKafka(logType, logData).catch(() => {
    // Silent fail - already logged in kafka module
  });
  
  // Send to Redis (async)
  sendToRedis(logType, logData).catch(() => {
    // Silent fail - already logged in redis module
  });
  
  // Store in database for API queries
  storeLog({
    timestamp: logEntry.timestamp,
    log_type: logType,
    data: JSON.stringify(logData)
  });
}

