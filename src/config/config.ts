export interface AppConfig {
  // Basic logging
  logRate: number;
  errorRate: number;
  warningRate: number;
  logLevel: string;
  logPath: string;
  
  // Access logs (Nginx format)
  enableAccessLogs: boolean;
  accessLogPath: string;
  
  // Attack simulation
  enableAttackSimulation: boolean;
  ddosAttackProbability: number;
  sqlInjectionProbability: number;
  xssAttackProbability: number;
  pathTraversalProbability: number;
  bruteForceAttackProbability: number;
  botTrafficProbability: number;
  
  // Realistic patterns
  enableBusinessHours: boolean;
  enableGeographicDistribution: boolean;
  
  // Real-time streaming options
  streaming: {
    // WebSocket
    websocket: {
      enabled: boolean;
      port: number;
      maxConnections: number;
    };
    
    // Kafka
    kafka: {
      enabled: boolean;
      brokers: string[];
      topic: string;
      clientId: string;
    };
    
    // Redis Streams
    redis: {
      enabled: boolean;
      host: string;
      port: number;
      stream: string;
      maxLen: number;
    };
  };
  
  // REST API for batch processing
  api: {
    enabled: boolean;
    port: number;
  };
  
  // Storage for historical queries
  storage: {
    type: "memory" | "sqlite";
    path: string;
    retentionHours: number;
  };
}

const config: AppConfig = {
  // Basic logging
  logRate: 10,
  errorRate: 0.20,
  warningRate: 0.15,
  logLevel: "info",
  logPath: "./logs/app.log",
  
  // Access logs
  enableAccessLogs: true,
  accessLogPath: "./logs/access.log",
  
  // Attack simulation (realistic percentages)
  enableAttackSimulation: true,
  ddosAttackProbability: 0.05,
  sqlInjectionProbability: 0.02,
  xssAttackProbability: 0.015,
  pathTraversalProbability: 0.01,
  bruteForceAttackProbability: 0.008,
  botTrafficProbability: 0.05,
  
  // Realistic patterns
  enableBusinessHours: true,
  enableGeographicDistribution: true,
  
  // Real-time streaming
  streaming: {
    websocket: {
      enabled: true,
      port: 9090,  // Changed from 8080 to avoid 8081/8082 range
      maxConnections: 100
    },
    kafka: {
      enabled: true,
      brokers: ["localhost:9092"],
      topic: "server-logs",
      clientId: "log-simulator"
    },
    redis: {
      enabled: true,
      host: "localhost",
      port: 6379,
      stream: "live-logs",
      maxLen: 100000
    }
  },
  
  // REST API
  api: {
    enabled: true,
    port: 4000  // Changed from 3000 for clear separation
  },
  
  // Storage
  storage: {
    type: "sqlite",
    path: "./data/logs.db",
    retentionHours: 48
  }
};

export default config;
