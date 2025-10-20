export interface AccessLogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  httpVersion: string;
  status: number;
  bytes: number;
  referer: string;
  userAgent: string;
  responseTime: number;
  userId?: string;
}

export interface AttackPattern {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  paths: string[];
  payload?: string;
  status: number[];
}

export type AttackType = 
  | "sql_injection" 
  | "xss" 
  | "path_traversal" 
  | "brute_force" 
  | "ddos" 
  | "command_injection"
  | "xxe"
  | "ssrf"
  | "bot_traffic";

