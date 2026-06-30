export const DEFAULT_BASE_PATH = '/api/cms/seo';
export const DEFAULT_QUERY_KEY_PREFIX = ['cms-seo'] as const;

/**
 * Stale time for read-mostly SEO data (site defaults + cascade-derived
 * previews): these change rarely relative to a dashboard session, so a 5-minute
 * freshness window avoids needless refetches on tab/window focus. The AI inbox
 * and audit grid stay at the React Query default (always-stale) since they
 * mutate frequently.
 */
export const READ_MOSTLY_STALE_TIME_MS = 5 * 60 * 1000;
