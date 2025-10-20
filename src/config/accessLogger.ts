import fs from "fs";
import path from "path";
import config from "./config";
import { AccessLogEntry } from "../types/attacks";

// Ensure logs directory exists
const logsDir = path.dirname(config.accessLogPath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Format timestamp in Nginx/Apache format: [20/Oct/2025:14:45:12 +0000]
 */
function formatTimestamp(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Get timezone offset
  const offset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
  const offsetSign = offset >= 0 ? '+' : '-';
  
  return `[${day}/${month}/${year}:${hours}:${minutes}:${seconds} ${offsetSign}${offsetHours}${offsetMinutes}]`;
}

/**
 * Write access log in Nginx combined log format
 * Format: $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" $request_time
 */
export function logAccess(entry: AccessLogEntry): void {
  if (!config.enableAccessLogs) return;
  
  const timestamp = formatTimestamp(new Date(entry.timestamp));
  const remoteUser = entry.userId || "-";
  const request = `${entry.method} ${entry.path} ${entry.httpVersion}`;
  const requestTime = (entry.responseTime / 1000).toFixed(3); // Convert ms to seconds
  
  const logLine = `${entry.ip} - ${remoteUser} ${timestamp} "${request}" ${entry.status} ${entry.bytes} "${entry.referer}" "${entry.userAgent}" ${requestTime}\n`;
  
  try {
    fs.appendFileSync(config.accessLogPath, logLine);
  } catch (error) {
    console.error("Failed to write access log:", error);
  }
}

export default logAccess;

