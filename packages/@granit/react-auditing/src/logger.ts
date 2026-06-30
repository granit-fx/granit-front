import { createLogger } from '@granit/logger';

/** Shared logger for the react-auditing package. Import this instance — every
 * other file reuses it, so the package builds exactly one logger (one instance
 * per package). */
export const logger = createLogger('react-auditing');
