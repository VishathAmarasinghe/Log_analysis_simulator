import express, { Request, Response } from "express";
import cors from "cors";
import config from "../config/config";
import { queryLogs, getLogCount, getStats } from "../storage/database";
import { getConnectionCount as getWSConnections } from "../streaming/websocket";
import { isKafkaConnected } from "../streaming/kafka";
import { isRedisConnected } from "../streaming/redis";

let server: any = null;

export function initAPI(): void {
  if (!config.api.enabled) return;
  
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        websocket: config.streaming.websocket.enabled,
        kafka: isKafkaConnected(),
        redis: isRedisConnected()
      }
    });
  });
  
  // Get logs with time range
  app.get("/api/logs", (req: Request, res: Response) => {
    try {
      const startTime = req.query.start_time as string;
      const endTime = req.query.end_time as string;
      const logType = (req.query.log_type as string) || "all";
      const limit = parseInt(req.query.limit as string) || 1000;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const logs = queryLogs({
        startTime,
        endTime,
        logType: logType as any,
        limit,
        offset
      });
      
      const total = getLogCount({
        startTime,
        endTime,
        logType: logType as any
      });
      
      res.json({
        count: logs.length,
        total,
        start_time: startTime,
        end_time: endTime,
        log_type: logType,
        logs: logs.map(log => ({
          ...log,
          data: JSON.parse(log.data)
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get latest logs (last N minutes/hours)
  app.get("/api/logs/latest", (req: Request, res: Response) => {
    try {
      const minutes = parseInt(req.query.minutes as string) || 15;
      const hours = parseInt(req.query.hours as string) || 0;
      const logType = (req.query.log_type as string) || "all";
      const limit = parseInt(req.query.limit as string) || 1000;
      
      const now = new Date();
      const startTime = new Date(now.getTime() - (hours * 60 + minutes) * 60 * 1000);
      
      const logs = queryLogs({
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        logType: logType as any,
        limit
      });
      
      res.json({
        count: logs.length,
        minutes: hours * 60 + minutes,
        log_type: logType,
        logs: logs.map(log => ({
          ...log,
          data: JSON.parse(log.data)
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get aggregated statistics
  app.get("/api/stats", (req: Request, res: Response) => {
    try {
      const startTime = req.query.start_time as string;
      const endTime = req.query.end_time as string;
      
      const stats = getStats({ startTime, endTime });
      
      res.json({
        start_time: startTime,
        end_time: endTime,
        ...stats
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get system status
  app.get("/api/status", (_req: Request, res: Response) => {
    res.json({
      timestamp: new Date().toISOString(),
      simulator: {
        log_rate: config.logRate,
        attack_simulation: config.enableAttackSimulation
      },
      streaming: {
        websocket: {
          enabled: config.streaming.websocket.enabled,
          port: config.streaming.websocket.port,
          connections: getWSConnections()
        },
        kafka: {
          enabled: config.streaming.kafka.enabled,
          connected: isKafkaConnected(),
          topic: config.streaming.kafka.topic
        },
        redis: {
          enabled: config.streaming.redis.enabled,
          connected: isRedisConnected(),
          stream: config.streaming.redis.stream
        }
      },
      storage: {
        type: config.storage.type,
        retention_hours: config.storage.retentionHours
      }
    });
  });
  
  // Start server
  server = app.listen(config.api.port, () => {
    console.log(`REST API server started on port ${config.api.port}`);
    console.log(`   API endpoints:`);
    console.log(`   - GET  http://localhost:${config.api.port}/health`);
    console.log(`   - GET  http://localhost:${config.api.port}/api/status`);
    console.log(`   - GET  http://localhost:${config.api.port}/api/logs`);
    console.log(`   - GET  http://localhost:${config.api.port}/api/logs/latest`);
    console.log(`   - GET  http://localhost:${config.api.port}/api/stats`);
  });
}

export function closeAPI(): void {
  if (server) {
    server.close(() => {
      console.log("REST API server closed");
    });
  }
}

