import { createLogger } from '@granit/logger';

/**
 * Package-scoped logger for the taxonomy admin UI. Mutation errors surface to
 * the user via the rendered alert/dialog; this records the developer-facing
 * detail (status, problem-detail) without logging PII.
 */
export const logger = createLogger('react-ui-taxonomy');
