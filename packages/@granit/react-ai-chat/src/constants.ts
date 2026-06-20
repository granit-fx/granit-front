export const API_VERSION = 'v1';

/** Route prefix served by the agentic chat endpoints (`MapGranitConversations`). */
export const MODULE = 'conversations';

/** Default base path for the chat endpoints. Apps override via the provider config. */
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}/${MODULE}`;

/** Default React Query key prefix for chat queries. */
export const DEFAULT_QUERY_KEY_PREFIX = ['ai-chat'] as const;

/** Default `@`-mention suggestions the composer requests per query (server cap: 25). */
export const DEFAULT_MENTION_SEARCH_LIMIT = 8;

/** Debounce applied to `@`-mention search before hitting the network, in ms. */
export const MENTION_SEARCH_DEBOUNCE_MS = 200;
