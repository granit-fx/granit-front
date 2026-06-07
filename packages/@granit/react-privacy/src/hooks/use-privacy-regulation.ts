import { getApplicableRegulation, listProcessingPurposes } from '@granit/privacy';
import { useQuery } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider';

import type {
  PrivacyProcessingPurposeResponse,
  PrivacyRegulationProfileResponse,
} from '@granit/privacy';
import type { UseQueryResult } from '@tanstack/react-query';

/** Returns the privacy regulation profile applicable to the current tenant. */
export function useApplicableRegulation(): UseQueryResult<PrivacyRegulationProfileResponse> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'regulation'),
    queryFn: () => getApplicableRegulation(config.client, config.basePath!),
  });
}

/** Lists all processing purposes for the current tenant. */
export function useProcessingPurposes(): UseQueryResult<PrivacyProcessingPurposeResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'purposes'),
    queryFn: () => listProcessingPurposes(config.client, config.basePath!),
  });
}
