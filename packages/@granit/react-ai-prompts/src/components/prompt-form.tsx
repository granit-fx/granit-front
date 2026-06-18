import { ICON_COLOR_PATTERN, PROMPT_LIMITS } from '@granit/ai-prompts';
import { cn } from '@granit/utils';
import { useState } from 'react';

import { defaultPromptLabels } from '../locales/index';

import { IconPicker } from './icon-picker';

import type { PromptTranslations } from '../locales/index';
import type { CategoryId, CreatePromptRequest } from '@granit/ai-prompts';

/** Editable prompt fields. */
export interface PromptFormValues {
  readonly name: string;
  readonly shortDescription: string;
  readonly content: string;
  readonly icon: string | null;
  readonly iconColor: string | null;
}

export interface PromptFormProps {
  /** Initial values (for the edit form). Category ids are passed through unchanged. */
  readonly initial?: Partial<PromptFormValues> & { readonly categoryIds?: readonly CategoryId[] };
  readonly onSubmit: (request: CreatePromptRequest) => void;
  readonly onCancel?: () => void;
  readonly submitting?: boolean;
  readonly labels?: PromptTranslations['Form'];
  readonly iconLabels?: PromptTranslations['IconPicker'];
  readonly className?: string;
}

/**
 * Create/edit form for a prompt. Validates the required name and instruction
 * and the hex `iconColor` at the edge before emitting a `CreatePromptRequest`
 * (also valid as an `UpdatePromptRequest` — same shape).
 */
export function PromptForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
  labels = defaultPromptLabels.Form,
  iconLabels,
  className,
}: Readonly<PromptFormProps>) {
  const [name, setName] = useState(initial?.name ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [icon, setIcon] = useState<string | null>(initial?.icon ?? null);
  const [iconColor, setIconColor] = useState<string | null>(initial?.iconColor ?? null);

  const nameValid = name.trim().length > 0;
  const contentValid = content.trim().length > 0;
  const colorValid = !iconColor || ICON_COLOR_PATTERN.test(iconColor);
  const canSubmit = nameValid && contentValid && colorValid && !submitting;

  return (
    <form
      data-slot="prompt-form"
      className={cn('flex flex-col gap-3', className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          name: name.trim(),
          content: content.trim(),
          shortDescription: shortDescription.trim() || null,
          icon,
          iconColor: iconColor || null,
          ...(initial?.categoryIds ? { categoryIds: initial.categoryIds } : {}),
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{labels.Name}</span>
        <input
          type="text"
          data-slot="prompt-name"
          value={name}
          maxLength={PROMPT_LIMITS.NAME_MAX_LENGTH}
          placeholder={labels.NamePlaceholder}
          aria-invalid={!nameValid}
          onChange={(event) => {
            setName(event.target.value);
          }}
          className="border-input rounded-md border px-2.5 py-1.5"
        />
        {!nameValid && <span className="text-destructive text-xs">{labels.NameRequired}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{labels.ShortDescription}</span>
        <input
          type="text"
          data-slot="prompt-short-description"
          value={shortDescription}
          maxLength={PROMPT_LIMITS.SHORT_DESCRIPTION_MAX_LENGTH}
          onChange={(event) => {
            setShortDescription(event.target.value);
          }}
          className="border-input rounded-md border px-2.5 py-1.5"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{labels.Content}</span>
        <textarea
          data-slot="prompt-content"
          value={content}
          rows={5}
          maxLength={PROMPT_LIMITS.CONTENT_MAX_LENGTH}
          placeholder={labels.ContentPlaceholder}
          aria-invalid={!contentValid}
          onChange={(event) => {
            setContent(event.target.value);
          }}
          className="border-input resize-y rounded-md border px-2.5 py-1.5"
        />
        {!contentValid && (
          <span className="text-destructive text-xs">{labels.ContentRequired}</span>
        )}
      </label>

      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="font-medium">{labels.Icon}</legend>
        <IconPicker
          icon={icon}
          iconColor={iconColor}
          labels={iconLabels}
          onIconChange={setIcon}
          onColorChange={setIconColor}
        />
      </fieldset>

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            data-slot="prompt-cancel"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm"
          >
            {labels.Cancel}
          </button>
        ) : null}
        <button
          type="submit"
          data-slot="prompt-save"
          disabled={!canSubmit}
          className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {labels.Save}
        </button>
      </div>
    </form>
  );
}
