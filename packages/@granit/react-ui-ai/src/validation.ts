import { AI_WORKSPACE_LIMITS } from '@granit/ai';
import { z } from 'zod';

import type { useTranslation } from '@granit/react-localization';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

export function createWorkspaceSchema(t: TranslateFn) {
  return z.object({
    // The workspace's machine key (slug) — the API's `key` field, and the same
    // value ai-chat references as `workspaceKey` on conversations/messages.
    key: z
      .string()
      .min(1, t('Validation.Required', { field: t('AI.Workspaces.Form.Key') }))
      .max(AI_WORKSPACE_LIMITS.KEY_MAX_LENGTH)
      .regex(AI_WORKSPACE_LIMITS.KEY_PATTERN, t('AI.Workspaces.Validation.NameFormat')),
    provider: z
      .string()
      .min(1, t('Validation.Required', { field: t('AI.Workspaces.Form.ProviderName') }))
      .max(64),
    model: z
      .string()
      .min(1, t('Validation.Required', { field: t('AI.Workspaces.Form.Model') }))
      .max(128),
    displayName: z
      .string()
      .max(AI_WORKSPACE_LIMITS.DISPLAY_NAME_MAX_LENGTH)
      .optional()
      .or(z.literal('')),
    systemPrompt: z.string().max(32000).optional().or(z.literal('')),
    temperature: z.coerce.number().min(0).max(2).optional().or(z.literal('')),
    maxOutputTokens: z.coerce.number().int().min(1).optional().or(z.literal('')),
  });
}

export function editWorkspaceSchema(t: TranslateFn) {
  return z.object({
    provider: z
      .string()
      .min(1, t('Validation.Required', { field: t('AI.Workspaces.Form.ProviderName') }))
      .max(64),
    model: z
      .string()
      .min(1, t('Validation.Required', { field: t('AI.Workspaces.Form.Model') }))
      .max(128),
    displayName: z
      .string()
      .max(AI_WORKSPACE_LIMITS.DISPLAY_NAME_MAX_LENGTH)
      .optional()
      .or(z.literal('')),
    systemPrompt: z.string().max(32000).optional().or(z.literal('')),
    temperature: z.coerce.number().min(0).max(2).optional().or(z.literal('')),
    maxOutputTokens: z.coerce.number().int().min(1).optional().or(z.literal('')),
    activated: z.boolean(),
  });
}

export type CreateWorkspaceFormValues = z.infer<ReturnType<typeof createWorkspaceSchema>>;
export type EditWorkspaceFormValues = z.infer<ReturnType<typeof editWorkspaceSchema>>;
