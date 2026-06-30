import { AIPromptsPermissions } from '@granit/ai-prompts';
import {
  useCreatePrompt,
  useCustomisePrompt,
  useDeletePrompt,
  usePrompt,
  usePrompts,
  useUpdatePrompt,
} from '@granit/react-ai-prompts';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { useState } from 'react';

import { PromptCatalogue } from './prompt-catalogue';
import { PromptForm } from './prompt-form';

import type { CreatePromptRequest, PromptId } from '@granit/ai-prompts';

type Editing =
  { readonly mode: 'create' } | { readonly mode: 'edit'; readonly id: PromptId } | null;

/**
 * Prompt catalogue management page: list with Customise (system) / Edit-Delete
 * (own), create + edit via a dialog form, and a delete confirmation. Affordances
 * are permission-gated; the server re-checks regardless.
 */
export function PromptCataloguePage() {
  const { t } = useTranslation();
  const prompts = usePrompts();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(AIPromptsPermissions.Templates.Manage);
  const canDelete = hasPermission(AIPromptsPermissions.Templates.Delete);

  const create = useCreatePrompt();
  const update = useUpdatePrompt();
  const remove = useDeletePrompt();
  const customise = useCustomisePrompt();

  const [editing, setEditing] = useState<Editing>(null);
  const [deletingId, setDeletingId] = useState<PromptId | null>(null);

  const editingPrompt = usePrompt(editing?.mode === 'edit' ? editing.id : null);

  const submit = async (request: CreatePromptRequest) => {
    if (editing?.mode === 'edit') {
      await update.updateAsync({ id: editing.id, request });
    } else {
      await create.createAsync(request);
    }
    setEditing(null);
  };

  return (
    <div data-slot="ai-prompts-page" className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('AiPrompts.Catalogue.Title', 'Prompt catalogue')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('AiPrompts.Catalogue.DescriptionBefore', 'Reusable ')}
          <code>/</code>
          {t(
            'AiPrompts.Catalogue.DescriptionAfter',
            ' prompts for the chat. System prompts are read-only — customise one to get an editable copy.'
          )}
        </p>
      </div>

      <PromptCatalogue
        prompts={prompts.data ?? []}
        canManage={canManage}
        canDelete={canDelete}
        onNew={() => {
          setEditing({ mode: 'create' });
        }}
        onEdit={(id) => {
          setEditing({ mode: 'edit', id });
        }}
        onDelete={setDeletingId}
        onCustomise={(id) => {
          customise.customise(id);
        }}
      />

      {/* Create / edit dialog */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.mode === 'edit'
                ? t('AiPrompts.Form.EditTitle', 'Edit prompt')
                : t('AiPrompts.Form.NewTitle', 'New prompt')}
            </DialogTitle>
          </DialogHeader>
          {editing?.mode === 'edit' && !editingPrompt.data ? (
            <p className="text-sm text-muted-foreground">
              {t('AiPrompts.Form.Loading', 'Loading…')}
            </p>
          ) : (
            <PromptForm
              initial={
                editing?.mode === 'edit' && editingPrompt.data
                  ? {
                      name: editingPrompt.data.name,
                      shortDescription: editingPrompt.data.shortDescription,
                      content: editingPrompt.data.content,
                      icon: editingPrompt.data.icon,
                      iconColor: editingPrompt.data.iconColor,
                      categoryIds: editingPrompt.data.categoryIds,
                    }
                  : undefined
              }
              submitting={create.isPending || update.isPending}
              onSubmit={submit}
              onCancel={() => {
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmActionDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title={t('AiPrompts.Delete.ConfirmTitle', 'Delete this prompt?')}
        description={t('AiPrompts.Delete.ConfirmDescription', 'This cannot be undone.')}
        confirmLabel={t('AiPrompts.Actions.Delete', 'Delete')}
        cancelLabel={t('AiPrompts.Actions.Cancel', 'Cancel')}
        onConfirm={() => {
          if (deletingId) remove.remove(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
