import { createLogger } from '@granit/logger';

// Package-scoped logger. The host can mute or route this via the shared
// @granit/logger transport configuration; we never call `console.*` directly.
export const logger = createLogger('react-ui-authentication-local');
