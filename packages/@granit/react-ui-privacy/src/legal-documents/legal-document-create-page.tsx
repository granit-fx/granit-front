import { useTranslation } from '@granit/react-localization';
import { useCreateLegalDocument } from '@granit/react-privacy';
import { Button, Separator } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LegalDocumentForm } from './components/legal-document-form';

import type { CreateLegalDocumentFormValues } from './validation';

export function LegalDocumentCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateLegalDocument();

  function handleSubmit(values: CreateLegalDocumentFormValues) {
    createMutation.mutate(
      {
        documentId: values.documentId,
        displayName: values.displayName,
        description: values.description || undefined,
        templateName: values.templateName || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('Privacy.LegalDocuments.CreateSuccess'));
          navigate('/privacy/legal-documents');
        },
      }
    );
  }

  return (
    <div data-slot="legal-document-create-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/privacy/legal-documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Privacy.LegalDocuments.Title')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Privacy.LegalDocuments.CreateTitle')}
        </h2>
      </div>

      <LegalDocumentForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/privacy/legal-documents')}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
