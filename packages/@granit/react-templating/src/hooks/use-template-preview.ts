import { previewTemplate, previewTemplateBinary } from '@granit/templating';
import { useMutation } from '@tanstack/react-query';

import { useTemplatingConfig } from '../providers/templating-provider';

import type { TemplatePreviewRequest } from '@granit/templating';

export function useTemplatePreview() {
  const { client, basePath } = useTemplatingConfig();
  return useMutation({
    mutationFn: ({ name, request }: { name: string; request: TemplatePreviewRequest }) =>
      previewTemplate(client, basePath, name, request),
  });
}

export function useTemplateBinaryPreview() {
  const { client, basePath } = useTemplatingConfig();
  return useMutation({
    mutationFn: ({ name, request }: { name: string; request: TemplatePreviewRequest }) =>
      previewTemplateBinary(client, basePath, name, request),
  });
}
