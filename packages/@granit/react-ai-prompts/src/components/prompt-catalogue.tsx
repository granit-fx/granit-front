import { cn } from '@granit/utils';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';

import { defaultPromptLabels } from '../locales/index';

import { PromptIcon } from './prompt-icon';

import type { PromptTranslations } from '../locales/index';
import type { PromptId, PromptSummaryResponse } from '@granit/ai-prompts';

export interface PromptCatalogueProps {
  readonly prompts: readonly PromptSummaryResponse[];
  readonly onNew?: () => void;
  readonly onEdit?: (id: PromptId) => void;
  readonly onDelete?: (id: PromptId) => void;
  readonly onCustomise?: (id: PromptId) => void;
  /** Gates Edit/Customise/New (server still enforces `AIPrompts.Templates.Manage`). */
  readonly canManage?: boolean;
  /** Gates Delete (server still enforces `AIPrompts.Templates.Delete`). */
  readonly canDelete?: boolean;
  readonly labels?: PromptTranslations['Catalogue'];
  readonly className?: string;
}

/**
 * Lists the prompt catalogue with management affordances. System prompts are
 * read-only — they offer **Customise** instead of Edit/Delete. Affordances are
 * gated by `canManage` / `canDelete`; the server re-checks regardless.
 */
export function PromptCatalogue({
  prompts,
  onNew,
  onEdit,
  onDelete,
  onCustomise,
  canManage = false,
  canDelete = false,
  labels = defaultPromptLabels.Catalogue,
  className,
}: Readonly<PromptCatalogueProps>) {
  return (
    <div data-slot="prompt-catalogue" className={cn('flex flex-col gap-2', className)}>
      {canManage && onNew ? (
        <div className="flex justify-end">
          <button
            type="button"
            data-slot="prompt-new"
            onClick={onNew}
            className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm"
          >
            <Plus className="size-3.5" aria-hidden />
            {labels.New}
          </button>
        </div>
      ) : null}

      {prompts.length === 0 ? (
        <p data-slot="catalogue-empty" className="text-muted-foreground py-6 text-center text-sm">
          {labels.Empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {prompts.map((prompt) => (
            <li
              key={prompt.id}
              data-slot="catalogue-item"
              data-system={prompt.isSystem}
              className="border-border flex items-center gap-3 rounded-md border p-2"
            >
              <PromptIcon
                icon={prompt.icon}
                iconColor={prompt.iconColor}
                className="size-5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{prompt.name}</span>
                  {prompt.isSystem ? (
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                      {labels.System}
                    </span>
                  ) : null}
                </div>
                <p className="text-muted-foreground truncate text-xs">{prompt.shortDescription}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {prompt.isSystem ? (
                  canManage && onCustomise ? (
                    <button
                      type="button"
                      data-slot="prompt-customise"
                      aria-label={`${labels.Customise} ${prompt.name}`}
                      onClick={() => {
                        onCustomise(prompt.id);
                      }}
                      className="hover:bg-accent inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                    >
                      <Copy className="size-3.5" aria-hidden />
                      {labels.Customise}
                    </button>
                  ) : null
                ) : (
                  <>
                    {canManage && onEdit ? (
                      <button
                        type="button"
                        data-slot="prompt-edit"
                        aria-label={`${labels.Edit} ${prompt.name}`}
                        onClick={() => {
                          onEdit(prompt.id);
                        }}
                        className="hover:bg-accent rounded-md p-1.5"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                    {canDelete && onDelete ? (
                      <button
                        type="button"
                        data-slot="prompt-delete"
                        aria-label={`${labels.Delete} ${prompt.name}`}
                        onClick={() => {
                          onDelete(prompt.id);
                        }}
                        className="hover:bg-accent text-destructive rounded-md p-1.5"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
