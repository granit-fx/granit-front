import { useTranslation } from '@granit/react-localization';
import { TemplatingProvider, useTemplateMutations } from '@granit/react-templating';
import { toast, Button, Separator } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { TEMPLATING_CONFIG } from '../constants';
import { logger } from '../logger';

import { TemplateForm } from './template-form';

import type { TemplateFormValues } from '../validation';

export function TemplateCreatePage() {
  return (
    <TemplatingProvider config={TEMPLATING_CONFIG}>
      <TemplateCreatePageContent />
    </TemplatingProvider>
  );
}

function TemplateCreatePageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { saveDraft } = useTemplateMutations();

  const handleSubmit = async (values: TemplateFormValues) => {
    try {
      await saveDraft.mutateAsync({
        name: values.name,
        culture: values.culture ?? undefined,
        content: values.content,
        mimeType: values.mimeType,
        layoutName: values.layoutName ?? null,
      });
      toast.success(t('Templates.Messages.Saved'));
      navigate(`/templating/templates/${values.name}`);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TemplateCreatePage] Save draft failed', err);
    }
  };

  return (
    <div data-slot="template-create-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/templating/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Templates.Title')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{t('Templates.Create')}</h2>
      </div>

      <TemplateForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/templating/templates')}
        isSubmitting={saveDraft.isPending}
      />
    </div>
  );
}
