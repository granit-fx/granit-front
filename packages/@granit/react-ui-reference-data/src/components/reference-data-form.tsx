import { useTranslation } from '@granit/react-localization';
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
  Switch,
} from '@granit/react-ui';
import { createConstraintsResolver, useFieldProps } from '@granit/react-validation';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { MetadataEditor } from './metadata-editor';

import type {
  CreateReferenceDataFormValues,
  EditReferenceDataFormValues,
  ReferenceDataFormValues,
} from './types';
import type { SchemaConstraints } from '@granit/validation';
import type { ReactNode } from 'react';
import type { Resolver, UseFormReturn } from 'react-hook-form';

interface ReferenceDataFormBaseProps {
  i18nPrefix?: string;
  constraints: SchemaConstraints;
  extraPropertySuggestions?: string[];
  showParentCode?: boolean;
  onCancel: () => void;
  isPending?: boolean;
  /** Slot for app-specific form sections inserted after labels card. */
  renderExtraFields?: (form: UseFormReturn<ReferenceDataFormValues>) => ReactNode;
}

interface CreateFormProps extends ReferenceDataFormBaseProps {
  mode: 'create';
  defaultValues?: Partial<CreateReferenceDataFormValues>;
  onSubmit: (data: CreateReferenceDataFormValues) => Promise<void>;
}

interface EditFormProps extends ReferenceDataFormBaseProps {
  mode: 'edit';
  defaultValues?: Partial<EditReferenceDataFormValues>;
  onSubmit: (data: EditReferenceDataFormValues) => Promise<void>;
}

type ReferenceDataFormProps = CreateFormProps | EditFormProps;

export function ReferenceDataForm(props: Readonly<ReferenceDataFormProps>) {
  const {
    mode,
    i18nPrefix = 'ReferenceData.Common',
    constraints: activeConstraints,
    extraPropertySuggestions,
    showParentCode = false,
    onCancel,
    isPending = false,
    renderExtraFields,
  } = props;
  const { t } = useTranslation();
  const isCreate = mode === 'create';

  const formResolver = useMemo(
    () =>
      createConstraintsResolver(
        activeConstraints,
        t
      ) as unknown as Resolver<ReferenceDataFormValues>,
    [activeConstraints, t]
  );

  const form = useForm<ReferenceDataFormValues>({
    resolver: formResolver,
    defaultValues: {
      labelEn: '',
      labelFr: '',
      labelNl: '',
      labelDe: '',
      sortOrder: 0,
      activated: true,
      validFrom: '',
      validTo: '',
      parentCode: '',
      metadata: [],
      ...(isCreate ? { code: '' } : {}),
      ...props.defaultValues,
    },
  });

  const codeProps = useFieldProps(activeConstraints, 'code', t);
  const labelEnProps = useFieldProps(activeConstraints, 'labelEn', t);
  const labelFrProps = useFieldProps(activeConstraints, 'labelFr', t);
  const labelNlProps = useFieldProps(activeConstraints, 'labelNl', t);
  const labelDeProps = useFieldProps(activeConstraints, 'labelDe', t);
  const sortOrderProps = useFieldProps(activeConstraints, 'sortOrder', t);

  const resetForm = useCallback(() => {
    form.reset({
      labelEn: '',
      labelFr: '',
      labelNl: '',
      labelDe: '',
      sortOrder: 0,
      activated: true,
      validFrom: '',
      validTo: '',
      parentCode: '',
      metadata: [],
      ...(isCreate ? { code: '' } : {}),
      ...props.defaultValues,
    });
  }, [form, isCreate, props.defaultValues]);

  useEffect(() => {
    if (props.defaultValues) {
      resetForm();
    }
  }, [props.defaultValues, resetForm]);

  // Warn on browser close with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (props.mode === 'create') {
      await props.onSubmit(data as CreateReferenceDataFormValues);
    } else {
      await props.onSubmit(data);
    }
  });

  return (
    <Form {...form}>
      <form data-slot="reference-data-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Code */}
        {isCreate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t(`${i18nPrefix}.Form.Code`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="code"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.Code`)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        {...codeProps.inputProps}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className="max-w-xs font-mono"
                      />
                    </FormControl>
                    {fieldState.error ? (
                      <FormMessage />
                    ) : (
                      codeProps.patternHint && (
                        <FormDescription>{codeProps.patternHint}</FormDescription>
                      )
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Labels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t(`${i18nPrefix}.Form.Labels`)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="labelEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.LabelEn`)}</FormLabel>
                    <FormControl>
                      <Input {...field} {...labelEnProps.inputProps} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="labelFr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.LabelFr`)}</FormLabel>
                    <FormControl>
                      <Input {...field} {...labelFrProps.inputProps} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="labelNl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.LabelNl`)}</FormLabel>
                    <FormControl>
                      <Input {...field} {...labelNlProps.inputProps} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="labelDe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.LabelDe`)}</FormLabel>
                    <FormControl>
                      <Input {...field} {...labelDeProps.inputProps} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* App-specific extra fields slot */}
        {renderExtraFields?.(form)}

        {/* Hierarchy & Extra Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t(`${i18nPrefix}.Form.ExtraSection`)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showParentCode && (
              <FormField
                control={form.control}
                name="parentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.ParentCode`)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(`${i18nPrefix}.Form.ParentCodePlaceholder`)}
                        className="max-w-xs font-mono"
                      />
                    </FormControl>
                    <FormDescription>{t(`${i18nPrefix}.Form.ParentCodeHint`)}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <MetadataEditor
              form={form}
              i18nPrefix={i18nPrefix}
              suggestions={extraPropertySuggestions}
            />
          </CardContent>
        </Card>

        {/* Status & Validity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t(`${i18nPrefix}.Form.Status`)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="activated"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pt-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">
                      {t(`${i18nPrefix}.Form.IsActive`)}
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.ValidFrom`)}</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.ValidTo`)}</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`${i18nPrefix}.Form.SortOrder`)}</FormLabel>
                    <FormControl>
                      <Input {...field} {...sortOrderProps.inputProps} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '...' : t('Common.Save')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Common.Cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
