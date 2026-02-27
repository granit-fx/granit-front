// ---------------------------------------------------------------------------
// @granit/logger — Configurable logger with pluggable transports
// ---------------------------------------------------------------------------

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevelName = keyof typeof LogLevel;
export type LogLevelValue = (typeof LogLevel)[LogLevelName];
export type LogContext = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Transport interface
// ---------------------------------------------------------------------------

export interface LogEntry {
  timestamp: number;
  level: LogLevelName;
  prefix: string;
  message: string;
  error?: unknown;
  context?: LogContext;
}

export interface LogTransport {
  send(entry: LogEntry): void;
  flush?(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Console transport (built-in default)
// ---------------------------------------------------------------------------

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error';

const LEVEL_STYLES: Record<
  LogLevelName,
  { bg: string; label: string; method: ConsoleMethod }
> = {
  DEBUG: { bg: '#71717a', label: 'debug', method: 'log' },
  INFO: { bg: '#0ea5e9', label: 'info ', method: 'info' },
  WARN: { bg: '#f59e0b', label: 'warn ', method: 'warn' },
  ERROR: { bg: '#ef4444', label: 'error', method: 'error' },
};

export function createConsoleTransport(): LogTransport {
  return {
    send(entry: LogEntry) {
      const { bg, label, method } = LEVEL_STYLES[entry.level];
      const args: unknown[] = [
        `%c ${label} %c ${entry.prefix} %c ${entry.message}`,
        `background: ${bg}; color: #fff; border-radius: 3px; font-weight: bold;`,
        'font-weight: bold;',
        'font-weight: normal;',
      ];
      if (entry.level === 'ERROR' && entry.error !== undefined) {
        args.push(entry.error);
      }
      if (entry.context !== undefined) {
        args.push(entry.context);
      }
      console[method](...args);
    },
  };
}

// ---------------------------------------------------------------------------
// Flush registry — shared beforeunload listener
// ---------------------------------------------------------------------------

const registeredTransports = new Set<LogTransport>();
let unloadListenerRegistered = false;

function registerForFlush(transport: LogTransport): void {
  if (!transport.flush) return;
  registeredTransports.add(transport);
  if (!unloadListenerRegistered && typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('beforeunload', () => {
      for (const t of registeredTransports) {
        t.flush?.();
      }
    });
    unloadListenerRegistered = true;
  }
}

// ---------------------------------------------------------------------------
// Log level resolution
// ---------------------------------------------------------------------------

function resolveLogLevelName(): LogLevelName {
  // import.meta.env is provided by Vite and Vitest at runtime.
  // Cast to avoid requiring vite/client types in library tsconfig.
  const viteEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  return viteEnv?.DEV === false ? 'WARN' : 'DEBUG';
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

export interface LoggerOptions {
  level?: LogLevelName;
  transports?: LogTransport[];
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  child(subPrefix: string): Logger;
}

export function createLogger(prefix: string, options?: LoggerOptions): Logger {
  const levelName = options?.level ?? resolveLogLevelName();
  const levelValue = LogLevel[levelName];
  const transports = options?.transports ?? [createConsoleTransport()];

  for (const transport of transports) {
    registerForFlush(transport);
  }

  function dispatch(entry: LogEntry): void {
    for (const transport of transports) {
      transport.send(entry);
    }
  }

  return {
    debug(message: string, context?: LogContext) {
      if (levelValue <= LogLevel.DEBUG) {
        dispatch({
          timestamp: Date.now(),
          level: 'DEBUG',
          prefix,
          message,
          context,
        });
      }
    },

    info(message: string, context?: LogContext) {
      if (levelValue <= LogLevel.INFO) {
        dispatch({
          timestamp: Date.now(),
          level: 'INFO',
          prefix,
          message,
          context,
        });
      }
    },

    warn(message: string, context?: LogContext) {
      if (levelValue <= LogLevel.WARN) {
        dispatch({
          timestamp: Date.now(),
          level: 'WARN',
          prefix,
          message,
          context,
        });
      }
    },

    error(message: string, error?: unknown, context?: LogContext) {
      if (levelValue <= LogLevel.ERROR) {
        dispatch({
          timestamp: Date.now(),
          level: 'ERROR',
          prefix,
          message,
          error,
          context,
        });
      }
    },

    child(subPrefix: string): Logger {
      return createLogger(`${prefix} ${subPrefix}`, {
        level: levelName,
        transports,
      });
    },
  };
}
