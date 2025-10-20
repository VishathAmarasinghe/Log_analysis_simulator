import logger from "./config/logger";
import config from "./config/config";
import simulateEvent from "./utils/generator";
import { initDatabase, closeDatabase } from "./storage/database";
import { initWebSocket, closeWebSocket } from "./streaming/websocket";
import { initKafka, closeKafka } from "./streaming/kafka";
import { initRedis, closeRedis } from "./streaming/redis";
import { initAPI, closeAPI } from "./api/server";

const INTERVAL_MS = 1000 / config.logRate;

async function startSimulator() {
  // Startup banner
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║           Autonomous Log Simulator Starting...                ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  // Initialize storage
  if (config.storage.type === "sqlite") {
    initDatabase();
  }
  
  // Initialize streaming services
  if (config.streaming.websocket.enabled) {
    initWebSocket();
  }
  
  if (config.streaming.kafka.enabled) {
    await initKafka();
  }
  
  if (config.streaming.redis.enabled) {
    initRedis();
  }
  
  // Initialize REST API
  if (config.api.enabled) {
    initAPI();
  }
  
  // Log configuration
  console.log("\nConfiguration:");
  console.log(`   - Log Rate: ${config.logRate} logs/sec`);
  console.log(`   - Error Rate: ${(config.errorRate * 100).toFixed(1)}%`);
  console.log(`   - Warning Rate: ${(config.warningRate * 100).toFixed(1)}%`);
  console.log(`   - Attack Simulation: ${config.enableAttackSimulation ? "Enabled" : "Disabled"}`);
  
  console.log("\nStreaming Services:");
  console.log(`   - WebSocket: ${config.streaming.websocket.enabled ? `Enabled (Port ${config.streaming.websocket.port})` : "Disabled"}`);
  console.log(`   - Kafka: ${config.streaming.kafka.enabled ? `Enabled (${config.streaming.kafka.brokers.join(", ")})` : "Disabled"}`);
  console.log(`   - Redis: ${config.streaming.redis.enabled ? `Enabled (${config.streaming.redis.host}:${config.streaming.redis.port})` : "Disabled"}`);
  
  console.log("\nAPI:");
  console.log(`   - REST API: ${config.api.enabled ? `Enabled (Port ${config.api.port})` : "Disabled"}`);
  
  console.log("\nStorage:");
  console.log(`   - Type: ${config.storage.type}`);
  console.log(`   - Retention: ${config.storage.retentionHours} hours`);
  
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║           Simulator Started - Generating Logs...              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");
  
  // Start simulation loop
  const intervalId = setInterval(() => {
    simulateEvent();
  }, INTERVAL_MS);
  
  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\n\nReceived ${signal} - Shutting down gracefully...`);
    
    clearInterval(intervalId);
    
    // Close all services
    closeWebSocket();
    await closeKafka();
    closeRedis();
    closeAPI();
    closeDatabase();
    
    console.log("\nSimulator stopped successfully\n");
    process.exit(0);
  };
  
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  
  // Handle uncaught errors
  process.on("uncaughtException", (error: Error) => {
    logger.error({
      message: "Uncaught Exception",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  });
  
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error({
      message: "Unhandled Promise Rejection",
      reason: reason,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  });
}

// Start the simulator
startSimulator().catch((error) => {
  console.error("Failed to start simulator:", error);
  process.exit(1);
});
