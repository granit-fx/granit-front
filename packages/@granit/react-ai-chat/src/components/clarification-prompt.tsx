import { cn } from '@granit/utils';
import { useState } from 'react';

import { defaultChatLabels } from '../locales/index';

import type { ChatTranslations } from '../locales/index';
import type { ClarificationResponse } from '@granit/ai-chat';

export interface ClarificationPromptProps {
  readonly clarification: ClarificationResponse;
  /**
   * Invoked with the chosen answer. For a listed option this is
   * `value ?? label`; for the free-text "other" field it is the typed string.
   * The host sends it as the next `message`.
   */
  readonly onChoose: (answer: string) => void;
  readonly labels?: ChatTranslations['Clarification'];
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Renders a clarifying question that blocked the turn: the question plus
 * clickable options, and — when `allowOther` — a free-text fallback. Choosing
 * an option (or submitting the free text) emits `onChoose`.
 */
export function ClarificationPrompt({
  clarification,
  onChoose,
  labels = defaultChatLabels.Clarification,
  disabled = false,
  className,
}: Readonly<ClarificationPromptProps>) {
  const [other, setOther] = useState('');
  const trimmedOther = other.trim();

  return (
    <section
      data-slot="clarification"
      aria-label={clarification.question}
      className={cn('border-border bg-card flex flex-col gap-3 rounded-lg border p-3', className)}
    >
      <p data-slot="clarification-question" className="text-sm font-medium">
        {clarification.question}
      </p>

      <ul className="flex flex-wrap gap-2">
        {clarification.options.map((option, index) => (
          <li key={`${option.label}-${index}`}>
            <button
              type="button"
              data-slot="clarification-option"
              disabled={disabled}
              onClick={() => {
                onChoose(option.value ?? option.label);
              }}
              className="border-border bg-background hover:bg-accent rounded-md border px-2.5 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>

      {clarification.allowOther ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedOther) onChoose(trimmedOther);
          }}
        >
          <input
            type="text"
            data-slot="clarification-other"
            value={other}
            disabled={disabled}
            placeholder={labels.OtherPlaceholder}
            aria-label={labels.Other}
            onChange={(event) => {
              setOther(event.target.value);
            }}
            className="border-input bg-background flex-1 rounded-md border px-2.5 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={disabled || trimmedOther === ''}
            className="bg-primary text-primary-foreground rounded-md px-2.5 py-1.5 text-sm disabled:opacity-50"
          >
            {labels.Submit}
          </button>
        </form>
      ) : null}
    </section>
  );
}
