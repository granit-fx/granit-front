import { apiKeysConstraints } from '@granit/authentication-api-keys';
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
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { Loader2, Plus, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { ApiKeyUpdateScopesFormValues } from '../validation';
import type { Resolver } from 'react-hook-form';

interface ApiKeyScopesFormProps {
  defaultValues: ApiKeyUpdateScopesFormValues;
  onSubmit: (data: ApiKeyUpdateScopesFormValues) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
  fields?: ('permissions' | 'allowedCidrs')[];
}

/** Title-cases a form field name to match the `ApiKeys.Fields.*` key suffix. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ApiKeyScopesForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending = false,
  fields,
}: Readonly<ApiKeyScopesFormProps>) {
  const { t } = useTranslation();

  // Spec-derived validation from the OpenAPI-backed apiKeysConstraints.
  const formResolver = createConstraintsResolver(apiKeysConstraints.ApiKeyUpdateScopesRequest, t, {
    labelResolver: (field) => t(`ApiKeys.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<ApiKeyUpdateScopesFormValues>;

  const form = useForm<ApiKeyUpdateScopesFormValues>({
    resolver: formResolver,
    defaultValues,
  });

  const showPermissions = !fields || fields.includes('permissions');
  const showCidrs = !fields || fields.includes('allowedCidrs');

  return (
    <Form {...form}>
      <form
        data-slot="api-key-scopes-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {showPermissions && (
          <FormField
            control={form.control}
            name="permissions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ApiKeys.Permissions')}</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('ApiKeys.PermissionsPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {showCidrs && (
          <FormField
            control={form.control}
            name="allowedCidrs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ApiKeys.AllowedCidrs')}</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('ApiKeys.AllowedCidrsPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('Common.Cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-1 size-3.5 animate-spin" />}
            {t('Common.Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

function TagInput({ value, onChange, placeholder }: Readonly<TagInputProps>) {
  const [input, setInput] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  }, [input, value, onChange]);

  const handleRemove = useCallback(
    (tag: string) => {
      onChange(value.filter((v) => v !== tag));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div data-slot="tag-input" className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!input.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-sm font-mono"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${tag}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
