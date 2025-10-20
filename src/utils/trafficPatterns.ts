import config from "../config/config";

// Realistic IP address generation
export function generateIP(): string {
  if (config.enableGeographicDistribution) {
    // Simulate different geographic regions
    const regions = [
      () => `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`, // Private network
      () => `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`, // Private network
      () => `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 255)}`, // Private network
      () => `203.0.${randomInt(1, 255)}.${randomInt(1, 255)}`, // Asia-Pacific
      () => `185.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`, // Europe
      () => `104.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`, // North America
      () => `41.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`, // Africa
    ];
    
    const selectedRegion = regions[Math.floor(Math.random() * regions.length)];
    return selectedRegion();
  }
  
  return `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`;
}

// User agents (browsers, bots, attackers)
export const userAgents = {
  normal: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  ],
  bots: [
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
    "Twitterbot/1.0",
    "LinkedInBot/1.0 (compatible; Mozilla/5.0; +http://www.linkedin.com)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  ],
  attackers: [
    "python-requests/2.31.0",
    "curl/7.88.1",
    "Wget/1.21.3",
    "sqlmap/1.7.2",
    "Nikto/2.5.0",
    "Nmap Scripting Engine",
    "() { :; }; /bin/bash -c 'echo vulnerable'",
    "masscan/1.3",
    "Scrapy/2.11.0",
    "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)",
  ]
};

// HTTP methods with realistic distribution
export function getHttpMethod(isAttack: boolean = false): string {
  if (isAttack) {
    return randomElement(["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"]);
  }
  
  const rand = Math.random();
  if (rand < 0.70) return "GET";      // 70% GET
  if (rand < 0.90) return "POST";     // 20% POST
  if (rand < 0.95) return "PUT";      // 5% PUT
  if (rand < 0.98) return "DELETE";   // 3% DELETE
  return "PATCH";                      // 2% PATCH
}

// Referer patterns
export function getReferer(path: string): string {
  const rand = Math.random();
  if (rand < 0.3) return "-"; // 30% direct traffic
  
  const domains = [
    "https://example.com",
    "https://www.google.com/search",
    "https://www.facebook.com",
    "https://twitter.com",
    "https://linkedin.com",
    "https://reddit.com"
  ];
  
  return randomElement(domains);
}

// Business hours traffic multiplier
export function getTrafficMultiplier(): number {
  if (!config.enableBusinessHours) return 1.0;
  
  const hour = new Date().getHours();
  
  // Peak hours: 9 AM - 5 PM (2x traffic)
  if (hour >= 9 && hour <= 17) return 2.0;
  
  // Early morning/late night (0.3x traffic)
  if (hour >= 0 && hour <= 6 || hour >= 23) return 0.3;
  
  // Regular hours (1x traffic)
  return 1.0;
}

// Helper function
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export { randomInt, randomElement };

