import { PROMPT_LIMITS } from '@granit/ai-prompts';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { createPromptResolver, type PromptFormValues } from '../validation';

import { IconPicker } from './icon-picker';

import type { CategoryId, CreatePromptRequest } from '@granit/ai-prompts';

export interface PromptFormProps {
  /** Initial values (for the edit form). Category ids are passed through unchanged. */
  readonly initial?: Partial<PromptFormValues> & { readonly categoryIds?: readonly CategoryId[] };
  readonly onSubmit: (request: CreatePromptRequest) => void;
  readonly onCancel?: () => void;
  readonly submitting?: boolean;
  readonly className?: string;
}

/**
 * Create/edit form for a prompt. Validation is spec-driven: the resolver derives
 * `required` / `maxLength` rules from the ai-prompts OpenAPI contract via
 * `createConstraintsResolver`, augmented with the client-only hex-colour rule the
 * contract expresses only as an opaque server validator (see `../validation`).
 * Emits a `CreatePromptRequest` (also valid as an `UpdatePromptRequest` — same
 * shape), preserving the edited prompt's `categoryIds`.
 */
export function PromptForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
  className,
}: Readonly<PromptFormProps>) {
  const { t } = useTranslation();
  const isEdit = initial !== undefined;

  const formResolver = useMemo(
    () => createPromptResolver(isEdit ? 'edit' : 'create', t),
    [isEdit, t]
  );

  const form = useForm<PromptFormValues>({
    resolver: formResolver,
    defaultValues: {
      name: initial?.name ?? '',
      shortDescription: initial?.shortDescription ?? '',
      content: initial?.content ?? '',
      icon: initial?.icon ?? null,
      iconColor: initial?.iconColor ?? null,
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      name: values.name.trim(),
      content: values.content.trim(),
      shortDescription: values.shortDescription.trim() || null,
      icon: values.icon,
      iconColor: values.iconColor || null,
      ...(initial?.categoryIds ? { categoryIds: initial.categoryIds } : {}),
    });
  });

  return (
    <Form {...form}>
      <form
        data-slot="prompt-form"
        onSubmit={handleSubmit}
        className={cn('flex flex-col gap-3', className)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('AiPrompts.Form.Name')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  data-slot="prompt-name"
                  maxLength={PROMPT_LIMITS.NAME_MAX_LENGTH}
                  placeholder={t('AiPrompts.Form.NamePlaceholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('AiPrompts.Form.ShortDescription')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  data-slot="prompt-short-description"
                  maxLength={PROMPT_LIMITS.SHORT_DESCRIPTION_MAX_LENGTH}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('AiPrompts.Form.Content')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  data-slot="prompt-content"
                  rows={5}
                  maxLength={PROMPT_LIMITS.CONTENT_MAX_LENGTH}
                  placeholder={t('AiPrompts.Form.ContentPlaceholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="iconColor"
          render={({ field: colorField }) => (
            <FormItem>
              <FormLabel>{t('AiPrompts.Form.Icon')}</FormLabel>
              <FormControl>
                <IconPicker
                  icon={form.watch('icon')}
                  iconColor={colorField.value}
                  onIconChange={(value) => {
                    form.setValue('icon', value, { shouldValidate: true });
                  }}
                  onColorChange={(value) => {
                    colorField.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" data-slot="prompt-cancel" onClick={onCancel}>
              {t('AiPrompts.Form.Cancel')}
            </Button>
          ) : null}
          <Button type="submit" data-slot="prompt-save" disabled={submitting}>
            {t('AiPrompts.Form.Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
