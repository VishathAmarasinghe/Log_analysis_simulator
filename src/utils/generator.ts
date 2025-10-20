import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger";
import config from "../config/config";
import logAccess from "../config/accessLogger";
import { distributeLog } from "../streaming";
import { Action, BaseLog, SuccessLog, WarningLog, ErrorLog } from "../types";
import { AccessLogEntry, AttackType } from "../types/attacks";
import { 
  generateIP, 
  userAgents, 
  getHttpMethod, 
  getReferer, 
  randomInt,
  randomElement
} from "./trafficPatterns";
import {
  generateAttackPath,
  getAttackStatus,
  shouldTriggerDDoSBurst,
  getDDoSIP,
  shouldTriggerBruteForce,
  getBruteForceIP
} from "./attackPatterns";

const actions: Action[] = [
  // Authentication & User Management (10 actions)
  { name: "login", successMsg: "User login successful", failMsg: "Login failed - authentication error", warningMsg: "Multiple login attempts detected" },
  { name: "logout", successMsg: "User logged out successfully", failMsg: "Logout failed - session error", warningMsg: "Session expired during logout" },
  { name: "signup", successMsg: "User registration completed", failMsg: "Signup failed - validation error", warningMsg: "Email already exists" },
  { name: "password_reset", successMsg: "Password reset successful", failMsg: "Password reset failed", warningMsg: "Reset token expired" },
  { name: "email_verification", successMsg: "Email verified successfully", failMsg: "Email verification failed", warningMsg: "Verification link expired" },
  { name: "two_factor_auth", successMsg: "2FA authentication successful", failMsg: "2FA verification failed", warningMsg: "Invalid 2FA code" },
  { name: "oauth_login", successMsg: "OAuth login successful", failMsg: "OAuth provider error", warningMsg: "OAuth token refresh needed" },
  { name: "session_refresh", successMsg: "Session refreshed", failMsg: "Session refresh failed", warningMsg: "Session about to expire" },
  { name: "account_deactivation", successMsg: "Account deactivated", failMsg: "Account deactivation failed", warningMsg: "Pending transactions exist" },
  { name: "permission_check", successMsg: "Permission verified", failMsg: "Permission denied", warningMsg: "Insufficient privileges" },
  
  // Profile & Settings (10 actions)
  { name: "update_profile", successMsg: "Profile updated successfully", failMsg: "Profile update failed", warningMsg: "Invalid profile data" },
  { name: "upload_avatar", successMsg: "Avatar uploaded", failMsg: "Avatar upload failed", warningMsg: "Image size too large" },
  { name: "change_password", successMsg: "Password changed", failMsg: "Password change failed", warningMsg: "Weak password detected" },
  { name: "update_email", successMsg: "Email updated", failMsg: "Email update failed", warningMsg: "Email verification required" },
  { name: "update_phone", successMsg: "Phone number updated", failMsg: "Phone update failed", warningMsg: "Invalid phone format" },
  { name: "privacy_settings", successMsg: "Privacy settings updated", failMsg: "Settings update failed", warningMsg: "Some settings require verification" },
  { name: "notification_preferences", successMsg: "Notifications updated", failMsg: "Preference update failed", warningMsg: "Invalid notification channel" },
  { name: "language_change", successMsg: "Language preference updated", failMsg: "Language change failed", warningMsg: "Unsupported locale" },
  { name: "timezone_update", successMsg: "Timezone updated", failMsg: "Timezone update failed", warningMsg: "Invalid timezone" },
  { name: "delete_account", successMsg: "Account deletion initiated", failMsg: "Account deletion failed", warningMsg: "Cooling period active" },
  
  // E-commerce & Shopping (15 actions)
  { name: "view_product", successMsg: "Product page viewed", failMsg: "Product not found", warningMsg: "Product availability low" },
  { name: "search_products", successMsg: "Search completed", failMsg: "Search service error", warningMsg: "No results found" },
  { name: "add_to_cart", successMsg: "Item added to cart", failMsg: "Failed to add to cart", warningMsg: "Item limited quantity" },
  { name: "remove_from_cart", successMsg: "Item removed from cart", failMsg: "Cart update failed", warningMsg: "Cart empty" },
  { name: "update_cart_quantity", successMsg: "Cart quantity updated", failMsg: "Quantity update failed", warningMsg: "Exceeds available stock" },
  { name: "apply_coupon", successMsg: "Coupon applied", failMsg: "Invalid coupon code", warningMsg: "Coupon expires soon" },
  { name: "checkout", successMsg: "Checkout completed", failMsg: "Checkout failed", warningMsg: "Inventory verification needed" },
  { name: "payment_processing", successMsg: "Payment processed", failMsg: "Payment declined", warningMsg: "Payment method verification required" },
  { name: "order_confirmation", successMsg: "Order confirmed", failMsg: "Order confirmation failed", warningMsg: "Delivery delay expected" },
  { name: "add_to_wishlist", successMsg: "Added to wishlist", failMsg: "Wishlist update failed", warningMsg: "Wishlist full" },
  { name: "product_review", successMsg: "Review submitted", failMsg: "Review submission failed", warningMsg: "Review pending moderation" },
  { name: "price_comparison", successMsg: "Price comparison loaded", failMsg: "Comparison service unavailable", warningMsg: "Limited data available" },
  { name: "track_order", successMsg: "Order tracking loaded", failMsg: "Tracking unavailable", warningMsg: "Tracking information delayed" },
  { name: "refund_request", successMsg: "Refund initiated", failMsg: "Refund request failed", warningMsg: "Outside refund window" },
  { name: "invoice_download", successMsg: "Invoice downloaded", failMsg: "Invoice generation failed", warningMsg: "Invoice processing" },
  
  // Content & Media (12 actions)
  { name: "upload_image", successMsg: "Image uploaded", failMsg: "Image upload failed", warningMsg: "Image compression applied" },
  { name: "upload_video", successMsg: "Video uploaded", failMsg: "Video upload failed", warningMsg: "Video processing queued" },
  { name: "upload_document", successMsg: "Document uploaded", failMsg: "Document upload failed", warningMsg: "Document size limit exceeded" },
  { name: "download_file", successMsg: "File downloaded", failMsg: "Download failed", warningMsg: "Slow download speed" },
  { name: "stream_video", successMsg: "Video streaming", failMsg: "Streaming failed", warningMsg: "Buffering detected" },
  { name: "create_post", successMsg: "Post created", failMsg: "Post creation failed", warningMsg: "Content flagged for review" },
  { name: "edit_post", successMsg: "Post updated", failMsg: "Post update failed", warningMsg: "Edit history maintained" },
  { name: "delete_post", successMsg: "Post deleted", failMsg: "Post deletion failed", warningMsg: "Soft delete applied" },
  { name: "like_content", successMsg: "Content liked", failMsg: "Like action failed", warningMsg: "Like limit reached" },
  { name: "share_content", successMsg: "Content shared", failMsg: "Share failed", warningMsg: "Share quota exceeded" },
  { name: "comment", successMsg: "Comment posted", failMsg: "Comment failed", warningMsg: "Comment requires moderation" },
  { name: "report_content", successMsg: "Content reported", failMsg: "Report submission failed", warningMsg: "Duplicate report" },
  
  // API & Integration (10 actions)
  { name: "api_call", successMsg: "API request successful", failMsg: "API request failed", warningMsg: "API rate limit approaching" },
  { name: "webhook_trigger", successMsg: "Webhook delivered", failMsg: "Webhook delivery failed", warningMsg: "Webhook retry scheduled" },
  { name: "data_sync", successMsg: "Data synchronized", failMsg: "Sync failed", warningMsg: "Partial sync completed" },
  { name: "export_data", successMsg: "Data exported", failMsg: "Export failed", warningMsg: "Large export queued" },
  { name: "import_data", successMsg: "Data imported", failMsg: "Import failed", warningMsg: "Data validation issues" },
  { name: "batch_process", successMsg: "Batch processing complete", failMsg: "Batch processing failed", warningMsg: "Some items skipped" },
  { name: "cache_refresh", successMsg: "Cache refreshed", failMsg: "Cache refresh failed", warningMsg: "Stale cache detected" },
  { name: "database_query", successMsg: "Query executed", failMsg: "Query timeout", warningMsg: "Slow query detected" },
  { name: "external_api_call", successMsg: "External API responded", failMsg: "External API unavailable", warningMsg: "External API slow response" },
  { name: "graphql_query", successMsg: "GraphQL query successful", failMsg: "GraphQL query failed", warningMsg: "Query complexity high" },
  
  // Analytics & Reporting (8 actions)
  { name: "generate_report", successMsg: "Report generated", failMsg: "Report generation failed", warningMsg: "Report data incomplete" },
  { name: "analytics_track", successMsg: "Event tracked", failMsg: "Tracking failed", warningMsg: "Tracking delayed" },
  { name: "dashboard_load", successMsg: "Dashboard loaded", failMsg: "Dashboard load failed", warningMsg: "Dashboard data stale" },
  { name: "metrics_query", successMsg: "Metrics retrieved", failMsg: "Metrics unavailable", warningMsg: "Metrics aggregation delayed" },
  { name: "export_analytics", successMsg: "Analytics exported", failMsg: "Export failed", warningMsg: "Export size limit reached" },
  { name: "ab_test_assignment", successMsg: "A/B test variant assigned", failMsg: "Test assignment failed", warningMsg: "Test quota reached" },
  { name: "funnel_analysis", successMsg: "Funnel analyzed", failMsg: "Analysis failed", warningMsg: "Insufficient data" },
  { name: "cohort_analysis", successMsg: "Cohort analysis complete", failMsg: "Cohort analysis failed", warningMsg: "Small cohort size" },
  
  // Messaging & Communication (10 actions)
  { name: "send_message", successMsg: "Message sent", failMsg: "Message delivery failed", warningMsg: "Message queued" },
  { name: "receive_message", successMsg: "Message received", failMsg: "Message receive failed", warningMsg: "Message delayed" },
  { name: "read_notification", successMsg: "Notification read", failMsg: "Notification load failed", warningMsg: "Too many unread notifications" },
  { name: "send_email", successMsg: "Email sent", failMsg: "Email delivery failed", warningMsg: "Email queued for retry" },
  { name: "send_sms", successMsg: "SMS sent", failMsg: "SMS delivery failed", warningMsg: "SMS rate limit" },
  { name: "push_notification", successMsg: "Push notification sent", failMsg: "Push failed", warningMsg: "Device token expired" },
  { name: "chat_message", successMsg: "Chat message delivered", failMsg: "Chat message failed", warningMsg: "User offline" },
  { name: "video_call", successMsg: "Video call connected", failMsg: "Video call failed", warningMsg: "Network quality poor" },
  { name: "voice_call", successMsg: "Voice call connected", failMsg: "Voice call failed", warningMsg: "Audio quality degraded" },
  { name: "group_chat", successMsg: "Group message sent", failMsg: "Group message failed", warningMsg: "Some members offline" },
  
  // Admin & Moderation (8 actions)
  { name: "admin_login", successMsg: "Admin login successful", failMsg: "Admin login failed", warningMsg: "IP not whitelisted" },
  { name: "user_ban", successMsg: "User banned", failMsg: "Ban action failed", warningMsg: "Ban requires review" },
  { name: "content_moderation", successMsg: "Content moderated", failMsg: "Moderation action failed", warningMsg: "Requires manual review" },
  { name: "bulk_update", successMsg: "Bulk update complete", failMsg: "Bulk update failed", warningMsg: "Partial update completed" },
  { name: "system_config", successMsg: "Configuration updated", failMsg: "Config update failed", warningMsg: "Requires system restart" },
  { name: "audit_log", successMsg: "Audit log created", failMsg: "Audit log failed", warningMsg: "Audit data incomplete" },
  { name: "backup_create", successMsg: "Backup created", failMsg: "Backup failed", warningMsg: "Backup storage low" },
  { name: "restore_data", successMsg: "Data restored", failMsg: "Restore failed", warningMsg: "Restore verification needed" },
  
  // Miscellaneous (17 actions)
  { name: "health_check", successMsg: "Health check passed", failMsg: "Health check failed", warningMsg: "Degraded performance" },
  { name: "subscription_upgrade", successMsg: "Subscription upgraded", failMsg: "Upgrade failed", warningMsg: "Billing verification required" },
  { name: "subscription_cancel", successMsg: "Subscription cancelled", failMsg: "Cancellation failed", warningMsg: "Refund pending" },
  { name: "invoice_payment", successMsg: "Invoice paid", failMsg: "Payment processing error", warningMsg: "Payment method declined" },
  { name: "location_update", successMsg: "Location updated", failMsg: "Location update failed", warningMsg: "GPS accuracy low" },
  { name: "qr_code_scan", successMsg: "QR code scanned", failMsg: "QR scan failed", warningMsg: "Invalid QR code" },
  { name: "barcode_scan", successMsg: "Barcode scanned", failMsg: "Barcode scan failed", warningMsg: "Product not found" },
  { name: "calendar_sync", successMsg: "Calendar synced", failMsg: "Calendar sync failed", warningMsg: "Sync conflicts detected" },
  { name: "booking_create", successMsg: "Booking confirmed", failMsg: "Booking failed", warningMsg: "Limited availability" },
  { name: "booking_cancel", successMsg: "Booking cancelled", failMsg: "Cancellation failed", warningMsg: "Cancellation fee applies" },
  { name: "feedback_submit", successMsg: "Feedback submitted", failMsg: "Feedback submission failed", warningMsg: "Feedback pending review" },
  { name: "survey_response", successMsg: "Survey completed", failMsg: "Survey submission failed", warningMsg: "Incomplete responses" },
  { name: "referral_code", successMsg: "Referral applied", failMsg: "Invalid referral code", warningMsg: "Referral limit reached" },
  { name: "loyalty_points", successMsg: "Points credited", failMsg: "Points credit failed", warningMsg: "Points expiring soon" },
  { name: "gift_card_redeem", successMsg: "Gift card redeemed", failMsg: "Redemption failed", warningMsg: "Partial balance remaining" },
  { name: "age_verification", successMsg: "Age verified", failMsg: "Age verification failed", warningMsg: "Manual verification required" },
  { name: "captcha_verification", successMsg: "CAPTCHA verified", failMsg: "CAPTCHA failed", warningMsg: "Multiple CAPTCHA attempts" }
];

const errorCodes = [
  "ERR_DB_CONNECTION",
  "ERR_TIMEOUT",
  "ERR_INVALID_TOKEN",
  "ERR_PAYMENT_GATEWAY",
  "ERR_SERVICE_UNAVAILABLE",
  "ERR_INTERNAL_SERVER",
  "ERR_NETWORK_FAILURE",
  "ERR_AUTH_FAILED",
  "ERR_PERMISSION_DENIED",
  "ERR_RESOURCE_NOT_FOUND",
  "ERR_VALIDATION_FAILED",
  "ERR_RATE_LIMIT_EXCEEDED",
  "ERR_FILE_UPLOAD_FAILED",
  "ERR_FILE_TOO_LARGE",
  "ERR_INVALID_FORMAT",
  "ERR_DUPLICATE_ENTRY",
  "ERR_TRANSACTION_FAILED",
  "ERR_EXTERNAL_API_ERROR",
  "ERR_CACHE_MISS",
  "ERR_QUEUE_FULL",
  "ERR_MEMORY_LIMIT",
  "ERR_DISK_FULL",
  "ERR_SESSION_EXPIRED",
  "ERR_INVALID_CREDENTIALS",
  "ERR_DATABASE_LOCK",
  "ERR_DEADLOCK_DETECTED",
  "ERR_CONNECTION_REFUSED",
  "ERR_SSL_CERTIFICATE",
  "ERR_DNS_RESOLUTION"
];

const warningTypes = [
  "RATE_LIMIT_WARNING",
  "SLOW_RESPONSE",
  "DEPRECATED_API",
  "CACHE_MISS",
  "RESOURCE_CONSTRAINT",
  "VALIDATION_WARNING",
  "HIGH_MEMORY_USAGE",
  "HIGH_CPU_USAGE",
  "DISK_SPACE_LOW",
  "CONNECTION_POOL_EXHAUSTED",
  "QUEUE_BACKLOG",
  "STALE_DATA",
  "PARTIAL_FAILURE",
  "RETRY_SCHEDULED",
  "FALLBACK_USED",
  "CIRCUIT_BREAKER_OPEN",
  "TIMEOUT_WARNING",
  "AUTHENTICATION_WARNING",
  "SUSPICIOUS_ACTIVITY",
  "QUOTA_WARNING",
  "EXPIRATION_WARNING",
  "SYNC_DELAY",
  "DATA_INCONSISTENCY",
  "CONFIGURATION_WARNING",
  "SECURITY_WARNING",
  "COMPLIANCE_WARNING",
  "PERFORMANCE_DEGRADATION",
  "API_VERSION_WARNING",
  "MAINTENANCE_WINDOW",
  "UPSTREAM_DEGRADED",
  "BACKUP_OVERDUE",
  "CERTIFICATE_EXPIRING",
  "LICENSE_WARNING",
  "INTEGRATION_WARNING"
];

function createBaseLog(): BaseLog {
  return {
    timestamp: new Date().toISOString(),
    user_id: randomInt(1, 1000),
    session_id: uuidv4().slice(0, 6),
    response_time_ms: randomInt(20, 500),
    service: "simulator-app"
  };
}

function simulateNormalEvent(): void {
  const action = randomElement(actions);
  const baseLog = createBaseLog();
  const errorRate = config.errorRate;
  const warningRate = config.warningRate;
  const rand = Math.random();

  // Generate IP and user agent for access log
  const ip = generateIP();
  const userAgent = randomElement(userAgents.normal);
  const method = getHttpMethod();
  const path = `/api/${action.name}/${randomInt(1, 1000)}`;
  const referer = getReferer(path);

  // Determine log type based on rates
  if (rand < errorRate) {
    // Generate ERROR log
    const errorStatuses: Array<500 | 502 | 503 | 504> = [500, 502, 503, 504];
    const status = randomElement(errorStatuses);
    const responseTime = randomInt(200, 2000);
    
    const errorLog: ErrorLog = {
      ...baseLog,
      level: "error",
      event: `${action.name}_failed`,
      status,
      message: action.failMsg,
      error_code: randomElement(errorCodes),
      response_time_ms: responseTime,
    };

    // Occasionally add stack trace
    if (Math.random() > 0.7) {
      errorLog.stack_trace = `Error at ${action.name}Handler.process (line ${randomInt(10, 500)})`;
    }

    logger.error(errorLog);
    
    // Distribute to streaming channels
    distributeLog("application", errorLog);
    
    // Access log
    const accessLog = {
      ip,
      timestamp: baseLog.timestamp,
      method,
      path,
      httpVersion: "HTTP/1.1",
      status,
      bytes: randomInt(100, 1000),
      referer,
      userAgent,
      responseTime,
      userId: `user${baseLog.user_id}`
    };
    logAccess(accessLog);
    distributeLog("access", accessLog);

  } else if (rand < errorRate + warningRate) {
    // Generate WARNING log
    const warningStatuses: Array<400 | 401 | 403 | 404 | 429> = [400, 401, 403, 404, 429];
    const status = randomElement(warningStatuses);
    const responseTime = randomInt(50, 800);
    
    const warningLog: WarningLog = {
      ...baseLog,
      level: "warn",
      event: `${action.name}_warning`,
      status,
      message: action.warningMsg || `Warning during ${action.name}`,
      warning_type: randomElement(warningTypes),
      response_time_ms: responseTime
    };

    logger.warn(warningLog);
    
    // Distribute to streaming channels
    distributeLog("application", warningLog);
    
    // Access log
    const accessLog = {
      ip,
      timestamp: baseLog.timestamp,
      method,
      path,
      httpVersion: "HTTP/1.1",
      status,
      bytes: randomInt(100, 2000),
      referer,
      userAgent,
      responseTime,
      userId: `user${baseLog.user_id}`
    };
    logAccess(accessLog);
    distributeLog("access", accessLog);

  } else {
    // Generate SUCCESS log
    const successStatuses: Array<200 | 201> = [200, 201];
    const status = randomElement(successStatuses);
    const responseTime = baseLog.response_time_ms;
    
    const successLog: SuccessLog = {
      ...baseLog,
      level: "info",
      event: action.name,
      status,
      message: action.successMsg
    };

    logger.info(successLog);
    
    // Distribute to streaming channels
    distributeLog("application", successLog);
    
    // Access log
    const accessLog = {
      ip,
      timestamp: baseLog.timestamp,
      method,
      path,
      httpVersion: "HTTP/1.1",
      status,
      bytes: randomInt(500, 5000),
      referer,
      userAgent,
      responseTime,
      userId: `user${baseLog.user_id}`
    };
    logAccess(accessLog);
    distributeLog("access", accessLog);
  }
}

function simulateAttackEvent(attackType: AttackType): void {
  const baseLog = createBaseLog();
  const path = generateAttackPath(attackType);
  const status = getAttackStatus(attackType);
  const responseTime = attackType === "ddos" ? randomInt(5000, 15000) : randomInt(100, 1000);
  
  // Special handling for DDoS and brute force (use persistent IPs)
  let ip: string;
  if (attackType === "ddos" && shouldTriggerDDoSBurst()) {
    ip = getDDoSIP();
  } else if (attackType === "brute_force" && shouldTriggerBruteForce()) {
    ip = getBruteForceIP();
  } else {
    ip = generateIP();
  }
  
  // Use attack-specific user agents
  const userAgent = attackType === "bot_traffic" 
    ? randomElement(userAgents.bots)
    : randomElement(userAgents.attackers);
  
  const method = getHttpMethod(true);
  
  // Log as error or warning based on attack severity
  const errorLog: ErrorLog = {
    ...baseLog,
    level: "error",
    event: `security_attack_${attackType}`,
    status,
    message: `Security attack detected: ${attackType}`,
    error_code: `ERR_SECURITY_${attackType.toUpperCase()}`,
    response_time_ms: responseTime,
  };
  
  logger.error(errorLog);
  
  // Distribute to streaming channels
  distributeLog("application", errorLog);
  
  // Access log shows the malicious request
  const accessLog = {
    ip,
    timestamp: baseLog.timestamp,
    method,
    path,
    httpVersion: "HTTP/1.1",
    status,
    bytes: randomInt(50, 500),
    referer: "-",
    userAgent,
    responseTime,
    userId: "-"
  };
  logAccess(accessLog);
  distributeLog("access", accessLog);
}

function simulateEvent(): void {
  if (!config.enableAttackSimulation) {
    simulateNormalEvent();
    return;
  }
  
  // Check for DDoS burst (highest priority)
  if (shouldTriggerDDoSBurst()) {
    simulateAttackEvent("ddos");
    return;
  }
  
  // Check for brute force attack
  if (shouldTriggerBruteForce()) {
    simulateAttackEvent("brute_force");
    return;
  }
  
  // Check for other attacks
  const rand = Math.random();
  
  if (rand < config.sqlInjectionProbability) {
    simulateAttackEvent("sql_injection");
  } else if (rand < config.sqlInjectionProbability + config.xssAttackProbability) {
    simulateAttackEvent("xss");
  } else if (rand < config.sqlInjectionProbability + config.xssAttackProbability + config.pathTraversalProbability) {
    simulateAttackEvent("path_traversal");
  } else if (rand < config.sqlInjectionProbability + config.xssAttackProbability + config.pathTraversalProbability + config.botTrafficProbability) {
    simulateAttackEvent("bot_traffic");
  } else {
    // Normal traffic
    simulateNormalEvent();
  }
}

export default simulateEvent;
