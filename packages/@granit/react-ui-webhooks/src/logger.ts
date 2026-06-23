import { createLogger } from '@granit/logger';

/** Package-scoped logger. The webhooks pages surface API failures through the
 * host's MutationCache toast; this records the developer-facing detail. */
export const logger = createLogger('react-ui-webhooks');
