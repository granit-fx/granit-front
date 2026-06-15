import { cn } from '@granit/utils';
import { ArrowUpRight } from 'lucide-react';

import { defaultChatLabels } from '../locales/index';

import type { ChatTranslations } from '../locales/index';
import type { SuggestedActionResponse } from '@granit/ai-chat';

export interface SuggestedActionsProps {
  readonly actions: readonly SuggestedActionResponse[];
  /**
   * Invoked when the user clicks an action. The action's `deepLink` is an app
   * route — the host app maps it to a navigation. **Never auto-invoked**: the
   * agent only proposes; the user decides.
   */
  readonly onSelect: (action: SuggestedActionResponse) => void;
  readonly labels?: ChatTranslations['Suggestions'];
  readonly className?: string;
}

/**
 * Renders streamed suggested actions as buttons. They emit `onSelect` instead
 * of navigating directly, so deep-link routing stays an app concern and no
 * action ever fires automatically.
 */
export function SuggestedActions({
  actions,
  onSelect,
  labels = defaultChatLabels.Suggestions,
  className,
}: Readonly<SuggestedActionsProps>) {
  if (actions.length === 0) return null;

  return (
    <section
      data-slot="suggested-actions"
      aria-label={labels.Title}
      className={cn('flex flex-col gap-2', className)}
    >
      <h3 className="text-muted-foreground text-xs font-medium">{labels.Title}</h3>
      <ul className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <li key={`${action.deepLink}-${index}`}>
            <button
              type="button"
              data-slot="suggested-action"
              onClick={() => {
                onSelect(action);
              }}
              title={action.description ?? undefined}
              className="border-border bg-card hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors"
            >
              <ArrowUpRight className="size-3.5" aria-hidden />
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
