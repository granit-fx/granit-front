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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { createLegalDocumentSchema, editLegalDocumentSchema } from '../validation';

import type { CreateLegalDocumentFormValues, EditLegalDocumentFormValues } from '../validation';

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

  const form = useForm<CreateLegalDocumentFormValues | EditLegalDocumentFormValues>({
    resolver: zodResolver(mode === 'create' ? createLegalDocumentSchema : editLegalDocumentSchema),
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
