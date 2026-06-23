import { useCreateAIWorkspace } from '@granit/react-ai';
import { useTranslation } from '@granit/react-localization';
import { Button, Separator } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { WorkspaceForm } from './components/workspace-form';
import { logger } from './logger';

import type { CreateWorkspaceFormValues } from './validation';

export function AIWorkspaceCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createAsync, isPending } = useCreateAIWorkspace();

  const handleSubmit = async (data: CreateWorkspaceFormValues) => {
    try {
      const result = await createAsync({
        name: data.key,
        provider: data.provider,
        model: data.model,
        workspaceModelName: data.workspaceModelName || null,
        systemPrompt: data.systemPrompt || null,
        temperature: data.temperature ? Number(data.temperature) : null,
        maxOutputTokens: data.maxOutputTokens ? Number(data.maxOutputTokens) : null,
      });
      toast.success(t('AI.Workspaces.CreateSuccess'));
      navigate(`/ai/workspaces/${result.name}`);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[AIWorkspaceCreatePage] Failed to create workspace', err);
    }
  };

  return (
    <div data-slot="ai-workspace-create-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ai/workspaces">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('AI.Workspaces.BackToList')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h2 className="text-2xl font-semibold text-foreground">{t('AI.Workspaces.CreateTitle')}</h2>
      </div>

      <WorkspaceForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/ai/workspaces')}
        isPending={isPending}
      />
    </div>
  );
}
