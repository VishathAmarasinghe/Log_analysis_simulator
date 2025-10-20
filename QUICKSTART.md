# Quick Start Guide

## Option 1: Run with All Services (Docker Compose)

This is the easiest way to get everything running:

```bash
# Start all services (Simulator + Kafka + Redis)
docker-compose up -d

# View logs
docker-compose logs -f log-simulator

# Stop all services
docker-compose down
```

**Services Started:**
- Log Simulator (ports: 4000, 9090)
- Kafka (port: 9092)
- Redis (port: 6379)
- Zookeeper (port: 2181)

---

## Option 2: Run Locally (Development)

### Prerequisites
1. **Node.js 18+** installed
2. **Kafka** running on localhost:9092 (optional - can disable in config)
3. **Redis** running on localhost:6379 (optional - can disable in config)

### Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Configure streaming (optional):**

Edit `src/config/config.ts` to enable/disable services:
```typescript
streaming: {
  websocket: { enabled: true },  // No dependencies needed
  kafka: { enabled: false },     // Set to false if no Kafka
  redis: { enabled: false }      // Set to false if no Redis
}
```

3. **Run in development mode:**
```bash
npm run dev
```

4. **Or build and run production:**
```bash
npm run build
npm start
```

---

## Access the Services

### REST API
```bash
# Health check
curl http://localhost:4000/health

# Get latest logs (last 15 minutes)
curl http://localhost:4000/api/logs/latest?minutes=15

# Get logs by time range
curl "http://localhost:4000/api/logs?start_time=2025-10-20T14:00:00Z&end_time=2025-10-20T15:00:00Z"

# Get statistics
curl http://localhost:4000/api/stats

# Get system status
curl http://localhost:4000/api/status
```

### WebSocket
```javascript
// Connect from browser or Node.js
const ws = new WebSocket('ws://localhost:9090');

ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log(log);
};
```

### Kafka Consumer (Example)
```bash
# Install kcat (formerly kafkacat)
brew install kcat  # macOS
# or
apt-get install kafkacat  # Linux

# Consume from Kafka topic
kcat -C -b localhost:9092 -t server-logs -f '%s\n'
```

### Redis Streams (Example)
```bash
# Connect to Redis
redis-cli

# Read from stream
XREAD COUNT 10 STREAMS live-logs 0
```

---

## Test Each Streaming Method

### 1. Test WebSocket
```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:9090

# You'll see logs streaming in real-time
```

### 2. Test Kafka
```bash
# List topics
kafka-topics --bootstrap-server localhost:9092 --list

# Consume messages
kafka-console-consumer --bootstrap-server localhost:9092 --topic server-logs --from-beginning
```

### 3. Test Redis Streams
```bash
redis-cli XREAD COUNT 100 STREAMS live-logs 0-0
```

### 4. Test REST API
```bash
# Get last 1 hour of logs
curl "http://localhost:4000/api/logs/latest?hours=1&limit=100" | jq

# Get only access logs
curl "http://localhost:4000/api/logs/latest?minutes=15&log_type=access" | jq

# Get only application logs
curl "http://localhost:4000/api/logs/latest?minutes=15&log_type=application" | jq
```

---

## Configuration Quick Reference

Edit `src/config/config.ts`:

```typescript
{
  // Basic
  logRate: 10,                    // Logs per second
  errorRate: 0.20,                // 20% errors
  
  // Enable/Disable Streaming
  streaming: {
    websocket: { enabled: true, port: 9090 },
    kafka: { enabled: true, brokers: ["localhost:9092"] },
    redis: { enabled: true, host: "localhost", port: 6379 }
  },
  
  // API
  api: { enabled: true, port: 4000 },
  
  // Storage
  storage: {
    type: "sqlite",               // or "memory"
    retentionHours: 48            // Keep 48 hours
  }
}
```

---

## Troubleshooting

### Kafka Connection Failed
```
ERROR: Failed to connect to Kafka
```
**Solution:** 
- Set `kafka: { enabled: false }` in config, or
- Start Kafka: `docker run -p 9092:9092 apache/kafka`

### Redis Connection Failed
```
ERROR: Redis connection error
```
**Solution:**
- Set `redis: { enabled: false }` in config, or
- Start Redis: `docker run -p 6379:6379 redis`

### Port Already in Use
```
Error: listen EADDRINUSE :::4000
```
**Solution:** Change ports in config:
```typescript
api: { port: 4001 },
streaming: { websocket: { port: 9091 } }
```

---

## Monitoring

### View Real-Time Statistics
```bash
watch -n 1 'curl -s http://localhost:4000/api/status | jq'
```

### Count Logs in Database
```bash
sqlite3 data/logs.db "SELECT COUNT(*) FROM logs;"
```

### Monitor WebSocket Connections
```bash
curl http://localhost:4000/api/status | jq '.streaming.websocket'
```


