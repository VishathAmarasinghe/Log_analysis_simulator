import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import config from "../config/config";

let db: Database.Database | null = null;

export interface StoredLog {
  id?: number;
  timestamp: string;
  log_type: "application" | "access";
  data: string; // JSON stringified
}

export function initDatabase(): void {
  if (config.storage.type !== "sqlite") return;
  
  // Ensure data directory exists
  const dbDir = path.dirname(config.storage.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  db = new Database(config.storage.path);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      log_type TEXT NOT NULL,
      data TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_log_type ON logs(log_type);
  `);
  
  console.log(`SQLite database initialized at ${config.storage.path}`);
  
  // Start cleanup task
  startCleanupTask();
}

export function storeLog(log: StoredLog): void {
  if (!db) return;
  
  try {
    const stmt = db.prepare("INSERT INTO logs (timestamp, log_type, data) VALUES (?, ?, ?)");
    stmt.run(log.timestamp, log.log_type, log.data);
  } catch (error) {
    console.error("Failed to store log:", error);
  }
}

export function queryLogs(options: {
  startTime?: string;
  endTime?: string;
  logType?: "application" | "access" | "all";
  limit?: number;
  offset?: number;
}): StoredLog[] {
  if (!db) return [];
  
  let sql = "SELECT * FROM logs WHERE 1=1";
  const params: any[] = [];
  
  if (options.startTime) {
    sql += " AND timestamp >= ?";
    params.push(options.startTime);
  }
  
  if (options.endTime) {
    sql += " AND timestamp <= ?";
    params.push(options.endTime);
  }
  
  if (options.logType && options.logType !== "all") {
    sql += " AND log_type = ?";
    params.push(options.logType);
  }
  
  sql += " ORDER BY timestamp DESC";
  
  if (options.limit) {
    sql += " LIMIT ?";
    params.push(options.limit);
    
    if (options.offset) {
      sql += " OFFSET ?";
      params.push(options.offset);
    }
  }
  
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as StoredLog[];
  } catch (error) {
    console.error("Failed to query logs:", error);
    return [];
  }
}

export function getLogCount(options: {
  startTime?: string;
  endTime?: string;
  logType?: "application" | "access" | "all";
}): number {
  if (!db) return 0;
  
  let sql = "SELECT COUNT(*) as count FROM logs WHERE 1=1";
  const params: any[] = [];
  
  if (options.startTime) {
    sql += " AND timestamp >= ?";
    params.push(options.startTime);
  }
  
  if (options.endTime) {
    sql += " AND timestamp <= ?";
    params.push(options.endTime);
  }
  
  if (options.logType && options.logType !== "all") {
    sql += " AND log_type = ?";
    params.push(options.logType);
  }
  
  try {
    const stmt = db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  } catch (error) {
    console.error("Failed to count logs:", error);
    return 0;
  }
}

export function getStats(options: {
  startTime?: string;
  endTime?: string;
}): any {
  if (!db) return {};
  
  const whereClause = [];
  const params: any[] = [];
  
  if (options.startTime) {
    whereClause.push("timestamp >= ?");
    params.push(options.startTime);
  }
  
  if (options.endTime) {
    whereClause.push("timestamp <= ?");
    params.push(options.endTime);
  }
  
  const where = whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";
  
  try {
    // Total count by type
    const typeStats = db.prepare(`
      SELECT log_type, COUNT(*) as count 
      FROM logs ${where}
      GROUP BY log_type
    `).all(...params);
    
    // Total count
    const total = db.prepare(`
      SELECT COUNT(*) as count FROM logs ${where}
    `).get(...params) as { count: number };
    
    return {
      total: total.count,
      by_type: typeStats
    };
  } catch (error) {
    console.error("Failed to get stats:", error);
    return {};
  }
}

function startCleanupTask(): void {
  // Clean up old logs every hour
  setInterval(() => {
    if (!db) return;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - config.storage.retentionHours);
    
    try {
      const stmt = db.prepare("DELETE FROM logs WHERE timestamp < ?");
      const result = stmt.run(cutoffTime.toISOString());
      
      if (result.changes > 0) {
        console.log(`Cleaned up ${result.changes} old logs (older than ${config.storage.retentionHours}h)`);
      }
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
    }
  }, 60 * 60 * 1000); // Every hour
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    console.log("SQLite database closed");
  }
}

