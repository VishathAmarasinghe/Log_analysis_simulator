import { createLogger, transports, format } from "winston";
import config from "./config";

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({
      filename: config.logPath,
      maxsize: 10485760, // 10MB per file
      tailable: true     // Keep logs forever, just create new files when max size reached
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length 
            ? `\n${JSON.stringify(meta, null, 2)}` 
            : "";
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

export default logger;

