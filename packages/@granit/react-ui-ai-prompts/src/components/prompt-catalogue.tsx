import { PromptIcon } from '@granit/react-ai-prompts';
import { useTranslation } from '@granit/react-localization';
import { Badge, Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';

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
  readonly className?: string;
}

/**
 * Lists the prompt catalogue with management affordances. System prompts are
 * read-only — they offer **Customise** instead of Edit/Delete. Affordances are
 * gated by `canManage` / `canDelete`; the server re-checks regardless. Built on
 * the `@granit/react-ui` `Button` / `Badge` primitives.
 */
export function PromptCatalogue({
  prompts,
  onNew,
  onEdit,
  onDelete,
  onCustomise,
  canManage = false,
  canDelete = false,
  className,
}: Readonly<PromptCatalogueProps>) {
  const { t } = useTranslation();

  return (
    <div data-slot="prompt-catalogue" className={cn('flex flex-col gap-2', className)}>
      {canManage && onNew ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" data-slot="prompt-new" onClick={onNew}>
            <Plus className="size-3.5" aria-hidden />
            {t('AiPrompts.Catalogue.New')}
          </Button>
        </div>
      ) : null}

      {prompts.length === 0 ? (
        <p data-slot="catalogue-empty" className="text-muted-foreground py-6 text-center text-sm">
          {t('AiPrompts.Catalogue.Empty')}
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
                    <Badge variant="secondary" className="text-[10px]">
                      {t('AiPrompts.Catalogue.System')}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground truncate text-xs">{prompt.shortDescription}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {prompt.isSystem ? (
                  canManage &&
                  onCustomise && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-slot="prompt-customise"
                      aria-label={`${t('AiPrompts.Catalogue.Customise')} ${prompt.name}`}
                      onClick={() => {
                        onCustomise(prompt.id);
                      }}
                    >
                      <Copy className="size-3.5" aria-hidden />
                      {t('AiPrompts.Catalogue.Customise')}
                    </Button>
                  )
                ) : (
                  <>
                    {canManage && onEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-slot="prompt-edit"
                        aria-label={`${t('AiPrompts.Catalogue.Edit')} ${prompt.name}`}
                        onClick={() => {
                          onEdit(prompt.id);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                    ) : null}
                    {canDelete && onDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-slot="prompt-delete"
                        className="text-destructive"
                        aria-label={`${t('AiPrompts.Catalogue.Delete')} ${prompt.name}`}
                        onClick={() => {
                          onDelete(prompt.id);
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
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
