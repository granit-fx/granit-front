import { getApplicationLocalization } from '@granit/localization';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ApplicationLocalizationDto } from '@granit/localization';
import type { UseQueryResult } from '@tanstack/react-query';

/** Options accepted by {@link useApplicationLocalization}. */
export interface UseApplicationLocalizationOptions {
  readonly client: AxiosInstance;
  /** Base path for the localization endpoint. Default: `/api/v1/localization`. */
  readonly basePath?: string;
  /** BCP-47 culture name. Omit to let the backend resolve from `Accept-Language`. */
  readonly cultureName?: string;
  readonly enabled?: boolean;
}

/**
 * Fetches all localization resources for the requested culture, plus the
 * list of available languages. Wraps the anonymous, browser-cached
 * `GET {basePath}` endpoint (cached 1h on the server side).
 *
 * Apps typically call this once at bootstrap and feed the result to
 * `applyTranslations` from `@granit/localization`.
 *
 * @example
 * ```tsx
 * const { data } = useApplicationLocalization({ client: api, cultureName: 'fr-BE' });
 * ```
 */
export function useApplicationLocalization(
  options: UseApplicationLocalizationOptions
): UseQueryResult<ApplicationLocalizationDto> {
  const { client, basePath = DEFAULT_BASE_PATH, cultureName, enabled } = options;
  return useQuery({
    queryKey: ['localization', 'application', cultureName ?? null],
    queryFn: () => getApplicationLocalization(client, basePath, cultureName),
    enabled: enabled ?? true,
    staleTime: 60 * 60_000,
  });
}
