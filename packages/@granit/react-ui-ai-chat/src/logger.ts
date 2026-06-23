import { createLogger } from '@granit/logger';

/**
 * Package-scoped logger for the AI Chat admin UI. Catch blocks log through this
 * instead of swallowing errors, so clipboard / report failures surface in the
 * host's transport pipeline while the user still gets a toast.
 */
export const logger = createLogger('react-ui-ai-chat');
