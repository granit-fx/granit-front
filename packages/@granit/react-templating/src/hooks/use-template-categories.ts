import { createCategory, deleteCategory, getCategories, updateCategory } from '@granit/templating';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import { templateKeys } from './query-keys';

import type { SaveTemplateCategoryRequest } from '@granit/templating';

export function useTemplateCategories() {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  return useQuery({
    queryKey: templateKeys.categories(queryKeyPrefix),
    queryFn: () => getCategories(client, basePath),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemplateCategoryMutations() {
  const { client, basePath, queryKeyPrefix } = useTemplatingConfig();
  const queryClient = useQueryClient();

  const invalidateCategories = () =>
    queryClient.invalidateQueries({ queryKey: templateKeys.categories(queryKeyPrefix) });

  const createMutation = useMutation({
    mutationFn: (request: SaveTemplateCategoryRequest) => createCategory(client, basePath, request),
    onSuccess: () => invalidateCategories(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: SaveTemplateCategoryRequest }) =>
      updateCategory(client, basePath, id, request),
    onSuccess: () => invalidateCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(client, basePath, id),
    onSuccess: () => invalidateCategories(),
  });

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
  };
}
