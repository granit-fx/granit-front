import { useTranslation } from '@granit/react-localization';
import { TemplatingProvider, useTemplate, useTemplateMutations } from '@granit/react-templating';
import {
  Button,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { TemplateForm } from './components/template-form';
import { TemplateHistory } from './components/template-history';
import { TemplateLifecycleActions } from './components/template-lifecycle-actions';
import { TemplatePreview } from './components/template-preview';
import { TemplateRevisionDiff } from './components/template-revision-diff';
import { TemplateStatusBadge } from './components/template-status-badge';
import { TEMPLATING_CONFIG } from './constants';
import { logger } from './logger';

import type { TemplateFormValues } from './validation';

export function TemplateEditPage() {
  const { name } = useParams<{ name: string }>();

  if (!name) return null;

  return (
    <TemplatingProvider config={TEMPLATING_CONFIG}>
      <TemplateEditPageContent name={name} />
    </TemplatingProvider>
  );
}

function TemplateEditPageContent({ name }: Readonly<{ name: string }>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: template, isLoading } = useTemplate(name);
  const { updateDraft } = useTemplateMutations();
  const [diffRevisions, setDiffRevisions] = useState<[string, string] | null>(null);

  const handleSubmit = async (values: TemplateFormValues) => {
    try {
      await updateDraft.mutateAsync({
        name,
        request: {
          name: values.name,
          culture: values.culture ?? undefined,
          content: values.content,
          mimeType: values.mimeType,
          layoutName: values.layoutName ?? null,
        },
      });
      toast.success(t('Templates.Messages.Saved'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TemplateEditPage] Update draft failed', err);
    }
  };

  if (isLoading) {
    return (
      <div data-slot="template-edit-page" className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div data-slot="template-edit-page" className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/templating/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('Templates.Title')}
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">{t('Common.NoResults')}</p>
      </div>
    );
  }

  const currentStatus = template.draft?.status ?? template.published?.status ?? 'Draft';

  return (
    <div data-slot="template-edit-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/templating/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('Templates.Title')}
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-foreground">{template.name}</h2>
              <TemplateStatusBadge status={currentStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {template.culture ?? t('Templates.CultureNeutral')}
            </p>
          </div>
        </div>

        <TemplateLifecycleActions template={template} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">{t('Templates.Editor.Title')}</TabsTrigger>
          <TabsTrigger value="preview">{t('Templates.Editor.Preview')}</TabsTrigger>
          <TabsTrigger value="history">{t('Templates.History.Title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-6">
          <TemplateForm
            defaultValues={{
              name: template.name,
              culture: template.culture,
              layoutName: template.layoutName,
              content: template.draft?.content ?? template.published?.content ?? '',
              mimeType: template.draft?.mimeType ?? template.published?.mimeType ?? 'text/html',
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/templating/templates')}
            isSubmitting={updateDraft.isPending}
            mode="edit"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <TemplatePreview templateName={name} culture={template.culture ?? undefined} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <TemplateHistory
            templateName={name}
            culture={template.culture ?? undefined}
            onCompare={(left, right) => setDiffRevisions([left, right])}
          />
        </TabsContent>
      </Tabs>

      {/* Diff dialog */}
      {diffRevisions && (
        <TemplateRevisionDiff
          templateName={name}
          leftRevisionId={diffRevisions[0]}
          rightRevisionId={diffRevisions[1]}
          open
          onOpenChange={(open) => {
            if (!open) setDiffRevisions(null);
          }}
        />
      )}
    </div>
  );
}
