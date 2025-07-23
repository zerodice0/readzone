/**
 * Logger utility for ReadZone application
 * Provides structured logging with appropriate log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: Error
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production'
  private minLevel: LogLevel = this.isProduction ? 'info' : 'debug'

  private getLevelPriority(level: LogLevel): number {
    const priorities: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return priorities[level]
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLevelPriority(level) >= this.getLevelPriority(this.minLevel)
  }

  private formatMessage(entry: LogEntry): string {
    const emoji = {
      debug: '🔍',
      info: '📋', 
      warn: '⚠️',
      error: '❌'
    }

    let message = `${emoji[entry.level]} [${entry.level.toUpperCase()}] ${entry.message}`
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` | Context: ${JSON.stringify(entry.context)}`
    }

    return message
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    }

    const formattedMessage = this.formatMessage(entry)

    // In production, you would send to a logging service
    // For now, use console methods based on level
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, error)
        break
      case 'info':
        console.info(formattedMessage, error)
        break
      case 'warn':
        console.warn(formattedMessage, error)
        break
      case 'error':
        console.error(formattedMessage, error)
        break
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log errors
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error)
  }

  /**
   * Log authentication events
   */
  auth(event: string, context?: LogContext): void {
    this.info(`[AUTH] ${event}`, context)
  }

  /**
   * Log email events
   */
  email(event: string, context?: LogContext): void {
    this.info(`[EMAIL] ${event}`, context)
  }

  /**
   * Log API events
   */
  api(method: string, endpoint: string, context?: LogContext): void {
    this.info(`[API] ${method} ${endpoint}`, context)
  }

  /**
   * Log database events
   */
  db(operation: string, context?: LogContext): void {
    this.debug(`[DB] ${operation}`, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export Logger class for testing
export { Logger }
export type { LogLevel, LogContext, LogEntry }