export const API_VERSION = 'v1';

/** Route prefix served by the prompt-catalogue endpoints (`MapGranitPrompts`). */
export const MODULE = 'prompts';

/** Default base path for the catalogue endpoints. Apps override via the provider. */
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}/${MODULE}`;

/** Default React Query key prefix for catalogue queries. */
export const DEFAULT_QUERY_KEY_PREFIX = ['ai-prompts'] as const;
