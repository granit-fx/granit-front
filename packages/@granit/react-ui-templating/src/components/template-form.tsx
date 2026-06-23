import { useTranslation } from '@granit/react-localization';
import { useTemplateLayouts } from '@granit/react-templating';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { templatingConstraints } from '@granit/templating';
import { useEffect } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';

import { TemplateEditor } from './template-editor';

import type { TemplateFormValues } from '../validation';

// Client-only UX guards layered ON TOP of the spec-derived constraints. The
// `SaveTemplateRequest` contract only carries `maxLength` + a case-insensitive
// `pattern` on `name` (the .NET endpoint owns the authoritative key rules), so
// these two rules are front augmentations:
//  1. minimum length of 3 (no `minLength` on `name` in the contract);
//  2. PascalCase enforcement — each dotted segment must start with an UPPERCASE
//     letter, stricter than the contract pattern which allows any letter case.
// Drop them once the backend tightens contracts/openapi/templating.json.
const NAME_MIN_LENGTH = 3;
const NAME_PASCAL_RE = /^[A-Z][a-zA-Z0-9]*(\.[A-Z][a-zA-Z0-9]*)+$/;
// Error code the spec resolver emits for a `maxLength` violation (mirrors
// `VALIDATION_ERROR_CODES.maxLength` from @granit/validation). The client `name`
// augmentation must not clobber this distinct, stronger spec error.
const MAX_LENGTH_CODE = 'Validation:Builtin:MaximumLength';

// The constraints expose lowercase field names (`name`, `content`); the i18n
// labels live under flat `Templates.Form.*` keys. This maps each constrained
// field to the label the form already renders so validation messages match.
const FIELD_LABEL_KEYS: Record<string, string> = {
  name: 'Templates.Form.Name',
  culture: 'Templates.Form.Culture',
  layoutName: 'Templates.Form.Layout',
  content: 'Templates.Form.Content',
  mimeType: 'Templates.Form.MimeType',
};

const MIME_TYPES = [
  { value: 'text/html', label: 'HTML' },
  { value: 'text/plain', label: 'Text' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
  { value: 'application/pdf', label: 'PDF' },
] as const;

const CULTURES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pt', label: 'Português' },
] as const;

interface TemplateFormProps {
  defaultValues?: Partial<TemplateFormValues>;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

export function TemplateForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
}: Readonly<TemplateFormProps>) {
  const { t } = useTranslation();
  const { data: layouts } = useTemplateLayouts();

  // `name`/`content`/`culture`/`mimeType` validation = spec constraints
  // (required, maxLength, pattern). `Validation:Builtin:*` messages are owned by
  // the host app's `Granit.Validation` bundle. The two client-only `name` rules
  // (min length + PascalCase) are added by wrapping the spec resolver below.
  const baseResolver = createConstraintsResolver(templatingConstraints.SaveTemplateRequest, t, {
    labelResolver: (field) => t(FIELD_LABEL_KEYS[field] ?? field),
  });
  const formResolver = (async (
    values: Record<string, unknown>,
    context: unknown,
    options: { fields: Record<string, { name: string }> }
  ) => {
    const result = await baseResolver(values, context, options);
    // The two client `name` rules are strictly stronger than the spec ones
    // (min length 3 vs none; the PascalCase regex is a subset of the spec's
    // case-insensitive pattern). So a name failing a client rule is always
    // invalid, and its precise message overrides the spec's generic pattern
    // error. Conversely, a name passing both client rules always satisfies the
    // spec pattern — leaving only the spec `maxLength` error (a check the client
    // does not duplicate), which is preserved untouched.
    if (typeof values.name === 'string' && values.name) {
      if (values.name.length < NAME_MIN_LENGTH) {
        result.errors.name = {
          type: 'minLength',
          message: t('Templates.Form.NameTooShort'),
        };
      } else if (!NAME_PASCAL_RE.test(values.name)) {
        result.errors.name = {
          type: 'pattern',
          message: t('Templates.Form.NameInvalidFormat'),
        };
      } else if (result.errors.name && result.errors.name.type !== MAX_LENGTH_CODE) {
        // Client rules satisfied but the spec flagged its (weaker) pattern —
        // defer to the client verdict: the name is valid.
        delete result.errors.name;
      }
    }
    return result;
  }) as unknown as Resolver<TemplateFormValues>;

  const form = useForm<TemplateFormValues>({
    resolver: formResolver,
    defaultValues: {
      name: '',
      culture: null,
      layoutName: null,
      content: '',
      mimeType: 'text/html',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({ ...form.getValues(), ...defaultValues });
    }
  }, [defaultValues]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty]);

  const currentMimeType = useWatch({ control: form.control, name: 'mimeType' });

  return (
    <Form {...form}>
      <form data-slot="template-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Templates.Form.Name')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('Templates.Form.Name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('Templates.Form.NamePlaceholder')}
                      disabled={mode === 'edit'}
                    />
                  </FormControl>
                  <FormDescription>{t('Templates.Form.NameHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="culture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Templates.Form.Culture')}</FormLabel>
                  <Select
                    value={field.value ?? '__none__'}
                    onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Templates.Form.CulturePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">{t('Templates.CultureNeutral')}</SelectItem>
                      {CULTURES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="layoutName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Templates.Form.Layout')}</FormLabel>
                  <Select
                    value={field.value ?? '__none__'}
                    onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Templates.Form.LayoutPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">{t('Templates.Form.LayoutDefault')}</SelectItem>
                      {layouts?.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mimeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Templates.Form.MimeType')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MIME_TYPES.map((mt) => (
                        <SelectItem key={mt.value} value={mt.value}>
                          {mt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Templates.Form.Content')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TemplateEditor
                      value={field.value}
                      onChange={field.onChange}
                      mimeType={currentMimeType}
                      templateName={mode === 'edit' ? defaultValues?.name : undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Common.Cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {t('Common.Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
