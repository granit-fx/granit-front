export const API_VERSION = 'v1';

/** Route prefix served by the agentic chat endpoints (`MapGranitConversations`). */
export const MODULE = 'conversations';

/** Default base path for the chat endpoints. Apps override via the provider config. */
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}/${MODULE}`;

/** Default React Query key prefix for chat queries. */
export const DEFAULT_QUERY_KEY_PREFIX = ['ai-chat'] as const;
