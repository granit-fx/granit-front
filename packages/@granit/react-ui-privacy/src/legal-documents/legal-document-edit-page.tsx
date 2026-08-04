import { useTranslation } from '@granit/react-localization';
import { useLegalDocument, useUpdateLegalDocument } from '@granit/react-privacy';
import { toast, Button, Separator } from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { LegalDocumentForm } from './components/legal-document-form';

import type { EditLegalDocumentFormValues } from './validation';

export function LegalDocumentEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: document, isLoading } = useLegalDocument(id ?? '');
  const updateMutation = useUpdateLegalDocument();

  useEffect(() => {
    if (document && document.lifecycleStatus !== 'Draft') {
      navigate('/privacy/legal-documents', { replace: true });
    }
  }, [document, navigate]);

  function handleSubmit(values: EditLegalDocumentFormValues) {
    if (!id) return;

    updateMutation.mutate(
      {
        id,
        request: {
          displayName: values.displayName,
          concurrencyStamp: values.concurrencyStamp,
          description: values.description || undefined,
          templateName: values.templateName || undefined,
          documentBlobId: values.documentBlobId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('Privacy.LegalDocuments.UpdateSuccess'));
          navigate('/privacy/legal-documents');
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document) {
    return <EmptyState message={t('Privacy.LegalDocuments.NotFound')} />;
  }

  return (
    <div data-slot="legal-document-edit-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/privacy/legal-documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Privacy.LegalDocuments.Title')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Privacy.LegalDocuments.EditTitle')}
        </h2>
      </div>

      <LegalDocumentForm
        mode="edit"
        defaultValues={{
          displayName: document.displayName,
          description: document.description ?? '',
          templateName: document.templateName ?? '',
          documentBlobId: document.documentBlobId ?? '',
          concurrencyStamp: document.concurrencyStamp,
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/privacy/legal-documents')}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
