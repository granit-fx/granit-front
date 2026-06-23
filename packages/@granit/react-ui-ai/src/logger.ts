import { createLogger } from '@granit/logger';

/** Package-scoped logger. Mutation errors surface to the user via the host's
 * MutationCache toast; this records the developer-facing detail. */
export const logger = createLogger('react-ui-ai');
