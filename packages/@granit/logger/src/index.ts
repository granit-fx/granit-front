export { LogLevel, createConsoleTransport, createLogger } from './logger';

export type {
  LogContext,
  LogEntry,
  LogLevelName,
  LogLevelValue,
  Logger,
  LoggerOptions,
  LogTransport,
} from './logger';

export {
  emailDomain,
  hashPrefix,
  redact,
  redactEmail,
  redactIpAddress,
  redactPhone,
  redactToken,
  redactUsername,
} from './redaction';
