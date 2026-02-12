/**
 * 轻量级日志工具类
 * 提供统一的日志格式，包含时间戳、日志级别、模块名称和结构化数据
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/** 从环境变量解析日志级别 */
function parseLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  switch (level) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    default: return LogLevel.DEBUG;
  }
}

/** 获取本地时间戳字符串 (YYYY-MM-DD HH:mm:ss.SSS) */
function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
}

/** 格式化附加数据为字符串 */
function formatData(data?: unknown): string {
  if (data === undefined || data === null) return '';
  if (data instanceof Error) {
    return ` | ${data.message}${data.stack ? '\n' + data.stack : ''}`;
  }
  if (typeof data === 'object') {
    try {
      return ' | ' + JSON.stringify(data);
    } catch {
      return ' | [Unserializable Object]';
    }
  }
  return ' | ' + String(data);
}

export class Logger {
  private module: string;
  private static globalLevel: LogLevel = parseLogLevel();
  private static pid: number = process.pid;

  constructor(module: string) {
    this.module = module;
  }

  /** 创建指定模块的 Logger 实例 */
  static create(module: string): Logger {
    return new Logger(module);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < Logger.globalLevel) return;

    const timestamp = getTimestamp();
    const label = LOG_LEVEL_LABELS[level];
    const prefix = `${timestamp} [${label}] [${this.module}] (pid:${Logger.pid})`;
    const suffix = formatData(data);
    const line = `${prefix} ${message}${suffix}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(line);
        break;
      case LogLevel.WARN:
        console.warn(line);
        break;
      default:
        console.log(line);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }
}
