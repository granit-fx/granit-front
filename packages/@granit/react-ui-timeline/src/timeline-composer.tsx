import type { FormEvent } from 'react';
import { useCallback, useState } from 'react';

import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { TimelineEntryType } from '@granit/timeline';
import type { PostTimelineEntryRequest, MentionSuggestion } from '@granit/timeline';
import { Lock, MessageSquare } from 'lucide-react';

import { cn } from '@granit/utils';

import { MentionEditor } from './mention-editor';

export interface TimelineComposerProps {
  onSubmit: (request: PostTimelineEntryRequest) => Promise<void>;
  parentEntryId?: string;
  entryTypes?: TimelineEntryType[];
  searchMentions?: (query: string) => Promise<MentionSuggestion[]>;
  placeholder?: string;
  submitLabel?: string;
  /**
   * Pre-fill the editor — used by edit flows that re-mount the composer
   * with an existing body. Only consumed on mount; subsequent prop
   * changes are ignored to avoid clobbering the user's keystrokes.
   */
  initialBody?: string;
  /**
   * Pre-select the entry type. Defaults to `entryTypes[0]`. Edit flows
   * pass the original entry's type so the selector reflects what the
   * user is editing (e.g. "Internal note" stays selected).
   */
  initialEntryType?: TimelineEntryType;
  /**
   * Hide the entry-type selector regardless of `entryTypes` length.
   * Edit flows don't let the user reclassify an entry.
   */
  hideEntryTypeSelector?: boolean;
  className?: string;
}

function pickEntryTypeLabel(
  type: (typeof TimelineEntryType)[keyof typeof TimelineEntryType],
  t: ReturnType<typeof useTranslation>['t']
): string {
  if (type === TimelineEntryType.InternalNote) {
    return t('Components.Timeline.Composer.InternalNote');
  }
  if (type === TimelineEntryType.SystemLog) {
    return t('Components.Timeline.Composer.SystemLog');
  }
  return t('Components.Timeline.Composer.Comment');
}

export function TimelineComposer({
  onSubmit,
  parentEntryId,
  entryTypes = [TimelineEntryType.Comment, TimelineEntryType.InternalNote],
  searchMentions,
  placeholder = 'Write a comment…',
  submitLabel = 'Send',
  initialBody = '',
  initialEntryType,
  hideEntryTypeSelector = false,
  className,
}: Readonly<TimelineComposerProps>) {
  const { t } = useTranslation();
  const [body, setBody] = useState(initialBody);
  // Resilience: if `initialEntryType` isn't in the allowed list (happens
  // when backend's `TimelineStreamEntryType` wire enum diverges from
  // domain `TimelineEntryType` — InternalNote arrives as `1` which
  // would map to SystemLog on the frontend), fall back to the first
  // type so the radiogroup always has a selected option. Tracked
  // upstream in granit-dotnet.
  const [entryType, setEntryType] = useState<TimelineEntryType>(
    initialEntryType !== undefined && entryTypes.includes(initialEntryType)
      ? initialEntryType
      : entryTypes[0]!
  );
  const [submitting, setSubmitting] = useState(false);

  const submitBody = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        entryType,
        body: trimmed,
        parentEntryId,
      });
      setBody('');
    } finally {
      setSubmitting(false);
    }
  }, [body, entryType, parentEntryId, submitting, onSubmit]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await submitBody();
    },
    [submitBody]
  );

  const isInternalNote = entryType === TimelineEntryType.InternalNote;

  return (
    <form
      data-slot="timeline-composer"
      onSubmit={(e) => {
        handleSubmit(e).catch(() => {});
      }}
      className={cn(
        'rounded-lg border border-border bg-card shadow-sm transition-colors',
        'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30',
        isInternalNote && 'border-primary/30 bg-primary/5',
        className
      )}
      data-testid="timeline-composer"
    >
      <MentionEditor
        initialBody={initialBody}
        onChange={setBody}
        searchMentions={searchMentions}
        placeholder={placeholder}
        disabled={submitting}
        onSubmit={() => {
          submitBody().catch(() => {});
        }}
      />

      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-2 py-1.5"
        data-testid="timeline-composer-footer"
      >
        {!hideEntryTypeSelector && entryTypes.length > 1 ? (
          <div
            role="radiogroup"
            aria-label={t('Components.Timeline.Composer.EntryType')}
            className="inline-flex items-center gap-0.5 rounded-md bg-muted/50 p-0.5"
            data-testid="timeline-composer-type-selector"
          >
            {entryTypes.map((type) => {
              const active = entryType === type;
              const Icon = type === TimelineEntryType.InternalNote ? Lock : MessageSquare;
              const label = pickEntryTypeLabel(type, t);
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setEntryType(type)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors',
                    // Bumped active styling: `bg-background` alone barely
                    // shows over the `bg-muted/50` container — especially
                    // in dark mode where both tokens collapse onto similar
                    // shades. A primary-tinted ring + bg makes the
                    // selected pill unambiguous in both themes.
                    active
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-primary/40'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        <Button
          type="submit"
          size="sm"
          disabled={!body.trim() || submitting}
          data-testid="timeline-composer-submit"
        >
          {submitting ? t('Components.Timeline.Composer.Sending') : submitLabel}
        </Button>
      </div>
    </form>
  );
}
