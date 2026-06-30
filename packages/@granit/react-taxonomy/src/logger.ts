import { createLogger } from '@granit/logger';

/**
 * Package-scoped logger for the headless taxonomy React bindings. Records
 * developer-facing detail on mutation errors and data-hook lifecycle without
 * logging PII (entity names, payloads).
 */
export const logger = createLogger('react-taxonomy');

/**
 * Record a mutation failure with operation context. Only the HTTP status,
 * problem-detail and error message are logged — never the request payload,
 * entity name, or other PII.
 */
export function logMutationError(operation: string, error: unknown): void {
  const response = (error as { response?: { status?: number; data?: { detail?: string } } })
    ?.response;
  logger.error(`${operation} failed`, {
    status: response?.status,
    detail: response?.data?.detail,
    message: error instanceof Error ? error.message : String(error),
  });
}
