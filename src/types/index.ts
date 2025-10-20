export interface Action {
  name: string;
  successMsg: string;
  failMsg: string;
  warningMsg?: string;
}

export interface BaseLog {
  timestamp: string;
  user_id: number;
  session_id: string;
  response_time_ms: number;
  service: string;
}

export interface SuccessLog extends BaseLog {
  level: "info";
  event: string;
  status: 200 | 201;
  message: string;
}

export interface WarningLog extends BaseLog {
  level: "warn";
  event: string;
  status: 400 | 401 | 403 | 404 | 429;
  message: string;
  warning_type?: string;
}

export interface ErrorLog extends BaseLog {
  level: "error";
  event: string;
  status: 500 | 502 | 503 | 504;
  message: string;
  error_code?: string;
  stack_trace?: string;
}

export type LogEntry = SuccessLog | WarningLog | ErrorLog;

