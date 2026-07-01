import {
  deleteDraft,
  publishTemplate,
  saveDraft,
  unpublishTemplate,
  updateDraft,
} from '@granit/templating';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templatingKeys } from './query-keys';

import type { SaveTemplateRequest } from '@granit/templating';

export function useTemplateMutations() {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  const queryClient = useQueryClient();

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: templatingKeys.all(queryKeyPrefix) });

  const invalidateDetail = (name: string) =>
    queryClient.invalidateQueries({ queryKey: templatingKeys.detail(queryKeyPrefix, name) });

  const invalidateLifecycle = (name: string) => {
    queryClient.invalidateQueries({ queryKey: templatingKeys.history(queryKeyPrefix, name) });
    queryClient.invalidateQueries({ queryKey: templatingKeys.lifecycle(queryKeyPrefix, name) });
  };

  const saveDraftMutation = useMutation({
    mutationFn: (request: SaveTemplateRequest) => saveDraft(client, basePath, request),
    onSuccess: (_data, vars) => {
      invalidateAll();
      if (vars.name) invalidateDetail(vars.name);
    },
  });

  const updateDraftMutation = useMutation({
    mutationFn: ({ name, request }: { name: string; request: SaveTemplateRequest }) =>
      updateDraft(client, basePath, name, request),
    onSuccess: (_data, vars) => {
      invalidateAll();
      invalidateDetail(vars.name);
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: ({ name, culture }: { name: string; culture?: string }) =>
      deleteDraft(client, basePath, name, culture),
    onSuccess: () => invalidateAll(),
  });

  const publishMutation = useMutation({
    mutationFn: ({ name, culture }: { name: string; culture?: string }) =>
      publishTemplate(client, basePath, name, culture),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(templatingKeys.detail(queryKeyPrefix, vars.name), data);
      invalidateAll();
      invalidateLifecycle(vars.name);
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: ({ name, culture }: { name: string; culture?: string }) =>
      unpublishTemplate(client, basePath, name, culture),
    onSuccess: (_data, vars) => {
      invalidateAll();
      invalidateDetail(vars.name);
      invalidateLifecycle(vars.name);
    },
  });

  return {
    saveDraft: saveDraftMutation,
    updateDraft: updateDraftMutation,
    deleteDraft: deleteDraftMutation,
    publish: publishMutation,
    unpublish: unpublishMutation,
  };
}
