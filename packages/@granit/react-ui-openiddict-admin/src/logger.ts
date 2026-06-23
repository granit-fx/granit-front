import { createLogger } from '@granit/logger';

/** Package-scoped logger. Mutation errors surface to the user via the toast in
 * each handler; this records the developer-facing detail for empty catches. */
export const logger = createLogger('react-ui-openiddict-admin');
