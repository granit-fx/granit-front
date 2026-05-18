export { LogLevel, createConsoleTransport, createLogger } from './logger.js';

export type {
  LogContext,
  LogEntry,
  LogLevelName,
  LogLevelValue,
  Logger,
  LoggerOptions,
  LogTransport,
} from './logger.js';

export {
  emailDomain,
  hashPrefix,
  redact,
  redactEmail,
  redactIpAddress,
  redactPhone,
  redactToken,
  redactUsername,
} from './redaction.js';
