import { EventEmitter } from 'node:events';

class LoggerService extends EventEmitter {
  constructor(maxLogs = 500) {
    super();
    this.maxLogs = maxLogs;
    this.logs = [];
  }

  getTehranTime(date = new Date()) {
    // Tehran is UTC+03:30 (Iran abolished DST in 2022)
    const tehranOffsetMs = (3 * 60 + 30) * 60 * 1000;
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
    const tehranDate = new Date(utcMs + tehranOffsetMs);

    const pad = (n) => String(n).padStart(2, '0');
    const hours = pad(tehranDate.getHours());
    const minutes = pad(tehranDate.getMinutes());
    const seconds = pad(tehranDate.getSeconds());
    return `${hours}:${minutes}:${seconds}`;
  }

  log(level, message, meta = null) {
    const now = new Date();
    const entry = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      timestamp: now.toISOString(),
      timeTehran: this.getTehranTime(now),
      level, // 'info' | 'success' | 'warn' | 'error'
      message,
      meta,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output
    const prefix = `[${entry.timeTehran} Tehran] [${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, meta || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, meta || '');
    } else {
      console.log(prefix, message, meta || '');
    }

    this.emit('log', entry);
    return entry;
  }

  info(message, meta = null) {
    return this.log('info', message, meta);
  }

  success(message, meta = null) {
    return this.log('success', message, meta);
  }

  warn(message, meta = null) {
    return this.log('warn', message, meta);
  }

  error(message, meta = null) {
    return this.log('error', message, meta);
  }

  getLogs(limit = 100, level = null) {
    let result = this.logs;
    if (level && level !== 'all') {
      result = result.filter((l) => l.level === level);
    }
    return result.slice(0, limit);
  }

  clear() {
    this.logs = [];
    this.emit('cleared');
  }
}

export const logger = new LoggerService();
