# Realistic Server Log Simulator (TypeScript + Node.js)

A comprehensive log generation application that simulates a real production server with security attacks, DDoS patterns, and realistic traffic. Features **multiple streaming options** (WebSocket, Kafka, Redis) and REST API for batch processing. Perfect for testing downstream log analysis, ETL pipelines, security monitoring, and threat detection systems.

> **Quick Start:** See [QUICKSTART.md](QUICKSTART.md) for immediate setup!

## Overview

This application automatically generates **two types of logs**:

### 1. Application Logs (JSON)
- **Success logs** (info level) - ~65% of logs
- **Warning logs** (warn level) - 15% of logs  
- **Error logs** (error level) - ~20% of logs
- **Security attack logs** - Various attack patterns

### 2. Nginx Access Logs (Combined Format)
- Standard Nginx/Apache combined log format
- Includes all HTTP requests with realistic metadata
- Shows attack patterns, user agents, response times

## Features

### Core Logging
- **Continuous Generation**: Automatically produces logs at configurable rates
- **100+ Event Types**: Comprehensive actions across authentication, e-commerce, content, APIs, analytics, messaging, and admin operations
- **Dual Log Formats**: Both structured JSON (application) and Nginx access logs
- **TypeScript**: Full type safety and modern ES2020+ features
- **Docker Ready**: Multi-stage build for production deployment

### Real-Time Streaming (Choose Your Method)
- **WebSocket** (port 9090): Direct streaming, perfect for live dashboards
- **Apache Kafka** (port 9092): Durable messaging, ideal for heavy ETL pipelines
- **Redis Streams** (port 6379): Ultra-fast streaming with persistence

### Batch Processing
- **REST API** (port 4000): Query historical logs by time range
- **SQLite Storage**: 48-hour retention for on-demand queries
- **Flexible Queries**: Filter by time, log type, pagination support

### Security Attack Simulation
- **SQL Injection**: Various injection patterns in queries
- **XSS Attacks**: Cross-site scripting attempts
- **Path Traversal**: Directory traversal attacks
- **DDoS Attacks**: Burst patterns with 50-200 requests from single IP
- **Brute Force**: Multiple failed login attempts
- **Bot Traffic**: Crawlers and malicious bots
- **Command Injection**: Shell command injection attempts
- **SSRF**: Server-side request forgery patterns

### Realistic Traffic Patterns
- **Geographic Distribution**: IP addresses from multiple regions
- **Business Hours**: Higher traffic during 9 AM - 5 PM
- **Realistic User Agents**: Browsers, mobile devices, bots, attackers
- **HTTP Method Distribution**: GET (70%), POST (20%), others (10%)
- **Referrer Chains**: Realistic referrer patterns
- **Response Times**: Varied based on request type and attacks

## Project Structure

```
simulator/
├── src/
│   ├── app.ts                      # Main application entry point
│   ├── config/
│   │   ├── config.ts               # Configuration settings
│   │   ├── logger.ts               # Winston logger configuration
│   │   └── accessLogger.ts         # Nginx access log writer
│   ├── types/
│   │   ├── index.ts                # Core TypeScript interfaces
│   │   └── attacks.ts              # Attack-related types
│   ├── utils/
│   │   ├── generator.ts            # Main log generation logic
│   │   ├── attackPatterns.ts       # Security attack simulations
│   │   └── trafficPatterns.ts      # Realistic traffic generation
│   ├── streaming/
│   │   ├── websocket.ts            # WebSocket server
│   │   ├── kafka.ts                # Kafka producer
│   │   ├── redis.ts                # Redis Streams producer
│   │   └── index.ts                # Unified distribution
│   ├── api/
│   │   └── server.ts               # REST API with Express
│   └── storage/
│       └── database.ts             # SQLite storage
├── logs/                           # Generated log files
│   ├── app.log                     # Application logs (JSON)
│   └── access.log                  # Nginx access logs
├── data/                           # SQLite database
│   └── logs.db                     # Historical logs
├── dist/                           # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml              # Multi-service deployment
├── QUICKSTART.md                   # Quick start guide
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, recommended for full stack)
- Kafka (optional, can be disabled in config)
- Redis (optional, can be disabled in config)

> **Note:** Use Docker Compose to run everything (Simulator + Kafka + Redis) with one command.

### Quick Start with Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This starts:
- Log Simulator with all features
- Apache Kafka (port 9092)
- Redis (port 6379)
- REST API (port 4000)
- WebSocket (port 9090)

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Configure streaming services (optional):**
Edit `src/config/config.ts` to customize:
```typescript
const config: AppConfig = {
  // Basic logging
  logRate: 10,
  errorRate: 0.20,
  warningRate: 0.15,
  
  // Streaming services (enable/disable as needed)
  streaming: {
    websocket: { enabled: true, port: 9090 },
    kafka: { enabled: true, brokers: ["localhost:9092"], topic: "server-logs" },
    redis: { enabled: true, host: "localhost", port: 6379, stream: "live-logs" }
  },
  
  // REST API
  api: { enabled: true, port: 4000 },
  
  // Storage
  storage: { type: "sqlite", retentionHours: 48 }
};
```

**Note:** You can enable/disable any streaming method independently.

3. **Run in development mode:**
```bash
npm run dev
```

4. **Build and run in production mode:**
```bash
npm run build
npm start
```

## Docker Deployment

### Option 1: Docker Compose (Recommended)
```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f log-simulator

# Stop everything
docker-compose down
```

### Option 2: Docker Only (Simulator)
```bash
# Build
docker build -t log-simulator .

# Run (without Kafka/Redis)
docker run -d \
  --name log-simulator \
  -p 4000:4000 -p 9090:9090 \
  -v $(pwd)/logs:/usr/src/app/logs \
  -v $(pwd)/data:/usr/src/app/data \
  log-simulator
```

## Log Formats

### 1. Application Logs (JSON - app.log)

#### Success Log
```json
{
  "timestamp": "2025-10-20T14:45:12.235Z",
  "level": "info",
  "event": "checkout",
  "user_id": 532,
  "session_id": "7f91b2",
  "status": 200,
  "response_time_ms": 87,
  "service": "simulator-app",
  "message": "Checkout completed successfully"
}
```

#### Warning Log
```json
{
  "timestamp": "2025-10-20T14:45:13.122Z",
  "level": "warn",
  "event": "search_warning",
  "user_id": 812,
  "session_id": "a3c4e1",
  "status": 404,
  "response_time_ms": 245,
  "service": "simulator-app",
  "message": "Search returned no results",
  "warning_type": "CACHE_MISS"
}
```

#### Error Log
```json
{
  "timestamp": "2025-10-20T14:45:14.567Z",
  "level": "error",
  "event": "checkout_failed",
  "user_id": 342,
  "session_id": "9k2p7m",
  "status": 500,
  "response_time_ms": 1523,
  "service": "simulator-app",
  "message": "Payment processing failed",
  "error_code": "ERR_PAYMENT_GATEWAY",
  "stack_trace": "Error at checkoutHandler.process (line 245)"
}
```

#### Security Attack Log
```json
{
  "timestamp": "2025-10-20T14:45:15.891Z",
  "level": "error",
  "event": "security_attack_sql_injection",
  "user_id": 729,
  "session_id": "x8f2a9",
  "status": 403,
  "response_time_ms": 342,
  "service": "simulator-app",
  "message": "Security attack detected: sql_injection",
  "error_code": "ERR_SECURITY_SQL_INJECTION"
}
```

### 2. Nginx Access Logs (Combined Format - access.log)

#### Normal Request
```
192.168.1.45 - user532 [20/Oct/2025:14:45:12 +0000] "GET /api/checkout/532 HTTP/1.1" 200 3421 "https://example.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" 0.087
```

#### SQL Injection Attack
```
185.143.223.101 - - [20/Oct/2025:14:45:15 +0000] "GET /api/products?id=' OR '1'='1 HTTP/1.1" 403 234 "-" "python-requests/2.31.0" 0.342
```

#### DDoS Attack (burst of requests from same IP)
```
104.28.45.123 - - [20/Oct/2025:14:45:16 +0000] "GET / HTTP/1.1" 503 156 "-" "curl/7.88.1" 12.456
104.28.45.123 - - [20/Oct/2025:14:45:16 +0000] "GET / HTTP/1.1" 503 156 "-" "curl/7.88.1" 13.234
104.28.45.123 - - [20/Oct/2025:14:45:16 +0000] "GET / HTTP/1.1" 503 156 "-" "curl/7.88.1" 14.123
... (50-200 requests from same IP)
```

#### Bot Traffic
```
203.45.123.89 - - [20/Oct/2025:14:45:17 +0000] "GET /robots.txt HTTP/1.1" 200 523 "-" "Googlebot/2.1 (+http://www.google.com/bot.html)" 0.045
```

## How to Consume Logs

### 1. WebSocket (Real-Time)
```javascript
const ws = new WebSocket('ws://localhost:9090');
ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log(log);
};
```

### 2. Kafka (Durable Streaming)
```javascript
const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'log-analyzer' });

await consumer.subscribe({ topic: 'server-logs' });
await consumer.run({
  eachMessage: async ({ message }) => {
    const log = JSON.parse(message.value.toString());
    // Process log
  }
});
```

### 3. Redis Streams (Fast Streaming)
```javascript
const Redis = require('ioredis');
const redis = new Redis();

// Read from stream
const logs = await redis.xread('COUNT', 100, 'STREAMS', 'live-logs', '0');
```

### 4. REST API (Batch Processing)
```bash
# Get latest 15 minutes
curl "http://localhost:4000/api/logs/latest?minutes=15"

# Get specific time range
curl "http://localhost:4000/api/logs?start_time=2025-10-20T14:00:00Z&end_time=2025-10-20T15:00:00Z"

# Get only access logs
curl "http://localhost:4000/api/logs/latest?minutes=15&log_type=access"
```

---

## Configuration

All configuration is in `src/config/config.ts`:

### Basic Logging
| Parameter | Default | Description |
|----------|---------|-------------|
| `logRate` | `10` | Number of logs generated per second |
| `errorRate` | `0.20` | Percentage of logs that are errors (0.0-1.0) |
| `warningRate` | `0.15` | Percentage of logs that are warnings (0.0-1.0) |
| `logLevel` | `info` | Minimum log level (error, warn, info, debug) |
| `logPath` | `./logs/app.log` | Path to application log file |

### Access Logs
| Parameter | Default | Description |
|----------|---------|-------------|
| `enableAccessLogs` | `true` | Enable Nginx-format access logs |
| `accessLogPath` | `./logs/access.log` | Path to access log file |

### Attack Simulation
| Parameter | Default | Description |
|----------|---------|-------------|
| `enableAttackSimulation` | `true` | Enable security attack simulation |
| `ddosAttackProbability` | `0.001` | DDoS burst probability (0.1%) |
| `sqlInjectionProbability` | `0.02` | SQL injection attempts (2%) |
| `xssAttackProbability` | `0.015` | XSS attack attempts (1.5%) |
| `pathTraversalProbability` | `0.01` | Path traversal attempts (1%) |
| `bruteForceAttackProbability` | `0.008` | Brute force attacks (0.8%) |
| `botTrafficProbability` | `0.05` | Bot/crawler traffic (5%) |

### Realistic Patterns
| Parameter | Default | Description |
|----------|---------|-------------|
| `enableBusinessHours` | `true` | 2x traffic during 9 AM - 5 PM |
| `enableGeographicDistribution` | `true` | Varied IP addresses from multiple regions |

### Streaming Services
| Service | Enabled | Configuration |
|---------|---------|---------------|
| **WebSocket** | Yes | Port: 9090, Max connections: 100 |
| **Kafka** | Yes | Brokers: localhost:9092, Topic: server-logs |
| **Redis** | Yes | Host: localhost:6379, Stream: live-logs |

### REST API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/status` | System status and statistics |
| `GET /api/logs` | Query logs by time range |
| `GET /api/logs/latest` | Get latest logs (last N minutes/hours) |
| `GET /api/stats` | Aggregated statistics |

## Event Types

The simulator generates **100+ event types** across 9 categories:

- **Authentication & User Management** (10): login, logout, signup, password_reset, 2FA, OAuth, etc.
- **Profile & Settings** (10): update_profile, upload_avatar, change_password, privacy settings, etc.
- **E-commerce & Shopping** (15): view_product, add_to_cart, checkout, payment, refunds, reviews, etc.
- **Content & Media** (12): upload/download files, streaming, posts, comments, likes, shares, etc.
- **API & Integration** (10): API calls, webhooks, data sync, exports, batch processing, etc.
- **Analytics & Reporting** (8): dashboards, metrics, reports, A/B tests, funnels, cohorts, etc.
- **Messaging & Communication** (10): messages, emails, SMS, push notifications, calls, etc.
- **Admin & Moderation** (8): admin access, user bans, content moderation, backups, etc.
- **Miscellaneous** (17): health checks, subscriptions, bookings, QR codes, loyalty points, etc.

## Security Attack Types

The simulator includes realistic attack patterns:

### SQL Injection
- Patterns: `' OR '1'='1`, `admin'--`, `UNION SELECT`, `DROP TABLE`, etc.
- Targets: `/api/products?id=`, `/search?q=`, `/login?user=`

### XSS (Cross-Site Scripting)
- Patterns: `<script>alert('xss')</script>`, `<img src=x onerror=alert(1)>`, etc.
- Targets: Search forms, comment fields, profile fields

### Path Traversal
- Patterns: `../../etc/passwd`, `../../../config/database.yml`, etc.
- Targets: File downloads, document viewers

### DDoS Attacks
- **Burst Pattern**: 50-200 requests from single IP in rapid succession
- Status: 503 (Service Unavailable), 429 (Too Many Requests)
- Response times: 5-15 seconds

### Brute Force
- **Pattern**: 20-50 failed login attempts from same IP
- Targets: `/login`, `/admin/login`, `/api/auth/login`
- Status: 401 (Unauthorized), 403 (Forbidden)

### Bot Traffic
- **Good Bots**: Googlebot, Bingbot, Facebook crawler
- **Bad Bots**: Scrapers, vulnerability scanners (Nikto, sqlmap, Nmap)
- Targets: robots.txt, sitemap.xml, API endpoints

## Use Cases

- **ETL Pipeline Testing**: Generate continuous data for pipeline development
- **Security Monitoring**: Test SIEM systems, threat detection, and intrusion detection
- **Log Analysis Tools**: Validate log aggregation and parsing systems
- **Anomaly Detection**: Train ML models to detect DDoS, SQL injection, and attacks
- **WAF Testing**: Test Web Application Firewall rules and configurations
- **Incident Response**: Practice investigating security incidents
- **Compliance Auditing**: Generate audit trails for compliance testing
- **Performance Testing**: Stress test log ingestion under attack scenarios
- **Data Engineering**: Build data pipelines with realistic security data

## Scripts

```bash
npm run build      # Compile TypeScript to JavaScript
npm start          # Run compiled application
npm run dev        # Run with ts-node (development)
npm run watch      # Watch mode with auto-reload
npm run clean      # Remove compiled files
```

## Notes

### Log Files
- **Application logs** (`app.log`): JSON format, all events and attacks
- **Access logs** (`access.log`): Nginx combined format, HTTP request details
- Logs are kept forever (no automatic deletion)
- New log file created when size reaches 10MB (numbered: app.log.1, app.log.2, etc.)
- Console output is colorized for better readability

### Attack Simulation
- DDoS bursts create 50-200 requests from same IP in rapid succession
- Brute force attacks show 20-50 failed login attempts from persistent IP
- Attack user agents match real attack tools (sqlmap, Nikto, curl, etc.)
- All attacks are logged in both application logs and access logs

### Traffic Patterns
- Business hours (9 AM - 5 PM) generate 2x normal traffic
- Geographic distribution simulates IPs from multiple regions
- User agents include modern browsers, mobile devices, and bots
- Response times vary based on event type and attack presence

### Configuration
- All settings in `src/config/config.ts` (no environment variables)
- Enable/disable attack simulation independently
- Fine-tune attack probabilities for your testing needs
- Toggle business hours and geographic distribution

## Integration Examples

### Kafka Producer (Optional Enhancement)
```typescript
// Add to generator.ts for Kafka streaming
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

// Send logs to Kafka topic
await producer.send({
  topic: 'application-logs',
  messages: [{ value: JSON.stringify(logEntry) }]
});
```

### Elasticsearch Integration
```bash
# Use Filebeat to ship logs to Elasticsearch
filebeat -e -c filebeat.yml
```

## License

ISC

---

Built for Data Engineers and Security Analysts

