import { privacyConstraints } from '@granit/privacy';
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
  Textarea,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { useForm, type Resolver } from 'react-hook-form';

import type { CreateLegalDocumentFormValues, EditLegalDocumentFormValues } from '../validation';

// Client-only UX guard for the `documentId` slug. The privacy contract carries only
// `required` + `maxLength` on `documentId` (the .NET endpoint owns the authoritative
// shape), so this regex is a front augmentation layered ON TOP of the spec-derived
// constraints — drop it once the backend exposes the pattern in
// contracts/openapi/privacy.json.
const DOCUMENT_ID_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// The constraints expose camelCase field names (`documentId`); the i18n label keys are
// PascalCase (`Privacy.LegalDocuments.Form.DocumentId`). This local helper bridges the
// two for the labelResolver.
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type LegalDocumentFormValues = CreateLegalDocumentFormValues | EditLegalDocumentFormValues;

interface CreateFormProps {
  readonly mode: 'create';
  readonly onSubmit: (values: CreateLegalDocumentFormValues) => void;
  readonly onCancel: () => void;
  readonly isSubmitting: boolean;
}

interface EditFormProps {
  readonly mode: 'edit';
  readonly defaultValues: EditLegalDocumentFormValues;
  readonly onSubmit: (values: EditLegalDocumentFormValues) => void;
  readonly onCancel: () => void;
  readonly isSubmitting: boolean;
}

type LegalDocumentFormProps = CreateFormProps | EditFormProps;

export function LegalDocumentForm(props: LegalDocumentFormProps) {
  const { t } = useTranslation();
  const { mode, onCancel, isSubmitting } = props;

  // Spec-driven validation: required / maxLength / uuid format come from the privacy
  // OpenAPI contract via createConstraintsResolver. `Validation:Builtin:*` messages are
  // owned by the backend `Granit.Validation` package (loaded by the host app). Field
  // names already match the DTO property names, so no remapping beyond the label key.
  const labelResolver = (field: string) =>
    t(`Privacy.LegalDocuments.Form.${capitalize(field)}`, field);
  const baseResolver = createConstraintsResolver(
    mode === 'create'
      ? privacyConstraints.LegalDocumentCreateRequest
      : privacyConstraints.LegalDocumentUpdateRequest,
    t,
    { labelResolver }
  );
  // Augment the create resolver with the client-only `documentId` slug check (see
  // DOCUMENT_ID_SLUG_RE above). The edit form has no `documentId` field, so the base
  // spec resolver is used as-is.
  const formResolver = (async (
    values: Record<string, unknown>,
    context: unknown,
    options: { fields: Record<string, { name: string }> }
  ) => {
    const result = await baseResolver(values, context, options);
    if (
      mode === 'create' &&
      !result.errors.documentId &&
      typeof values.documentId === 'string' &&
      values.documentId &&
      !DOCUMENT_ID_SLUG_RE.test(values.documentId)
    ) {
      result.errors.documentId = {
        type: 'slug',
        message: t('Privacy.LegalDocuments.Form.DocumentIdSlugError'),
      };
    }
    return result;
  }) as unknown as Resolver<LegalDocumentFormValues>;

  const form = useForm<LegalDocumentFormValues>({
    resolver: formResolver,
    defaultValues:
      mode === 'edit'
        ? props.defaultValues
        : { documentId: '', displayName: '', description: '', templateName: '' },
  });

  function handleSubmit(values: CreateLegalDocumentFormValues | EditLegalDocumentFormValues) {
    if (mode === 'create') {
      props.onSubmit(values as CreateLegalDocumentFormValues);
    } else {
      props.onSubmit(values as EditLegalDocumentFormValues);
    }
  }

  return (
    <Form {...form}>
      <form
        data-slot="legal-document-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('Privacy.LegalDocuments.Form.Details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Privacy.LegalDocuments.Form.DocumentId')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="privacy-policy" />
                    </FormControl>
                    <FormDescription>
                      {t('Privacy.LegalDocuments.Form.DocumentIdHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Privacy.LegalDocuments.Form.DisplayName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Privacy.LegalDocuments.Form.Description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} rows={3} />
                  </FormControl>
                  <FormDescription>
                    {t('Privacy.LegalDocuments.Form.DescriptionHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Privacy.LegalDocuments.Form.TemplateName')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>
                    {t('Privacy.LegalDocuments.Form.TemplateNameHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="documentBlobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Privacy.LegalDocuments.Form.DocumentBlobId')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="00000000-0000-0000-0000-000000000000"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Privacy.LegalDocuments.Form.DocumentBlobIdHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('Common.Loading') : t('Common.Save')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Common.Cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
