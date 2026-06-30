import { addSiteHostname, removeSiteHostname, verifySiteHostname } from '@granit/cms-hostnames';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '../logger';
import { useCmsHostnamesConfig } from '../providers/cms-hostnames-provider';

import { cmsHostnamesKeys } from './query-keys';

import type { SiteHostnameCreateRequest, SiteHostnameResponse } from '@granit/cms-hostnames';
import type { UseMutationResult } from '@tanstack/react-query';

export function useAddSiteHostname(
  siteId: string
): UseMutationResult<SiteHostnameResponse, Error, SiteHostnameCreateRequest> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => addSiteHostname(client, basePath, siteId, req),
    onSuccess: (data) => {
      logger.info('Site hostname added', { siteId, hostnameId: data.id });
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}

export function useRemoveSiteHostname(siteId: string): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hostnameId) => removeSiteHostname(client, basePath, siteId, hostnameId),
    onSuccess: (_data, hostnameId) => {
      logger.info('Site hostname removed', { siteId, hostnameId });
      qc.removeQueries({ queryKey: cmsHostnamesKeys.detail(queryKeyPrefix, siteId, hostnameId) });
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}

export function useVerifySiteHostname(
  siteId: string
): UseMutationResult<SiteHostnameResponse, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hostnameId) => verifySiteHostname(client, basePath, siteId, hostnameId),
    onSuccess: (data) => {
      logger.info('Site hostname verification triggered', { siteId, hostnameId: data.id });
      qc.setQueryData(cmsHostnamesKeys.detail(queryKeyPrefix, siteId, data.id), data);
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}
