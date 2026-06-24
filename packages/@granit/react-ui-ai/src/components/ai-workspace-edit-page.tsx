import { AI_WORKSPACE_KINDS, AIPermissions } from '@granit/ai';
import { useAIWorkspace, useUpdateAIWorkspace } from '@granit/react-ai';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import { toast, Badge, Button, Separator, Spinner } from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { logger } from '../logger';

import { WorkspaceDetail } from './workspace-detail';
import { WorkspaceForm } from './workspace-form';
import { WorkspaceTestPanel } from './workspace-test-panel';

import type { EditWorkspaceFormValues } from '../validation';

export function AIWorkspaceEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(AIPermissions.Workspaces.Manage);
  const { data: workspace, isLoading, error } = useAIWorkspace(name ?? '');
  const { updateAsync, isPending } = useUpdateAIWorkspace();

  const handleSubmit = async (data: EditWorkspaceFormValues) => {
    if (!name) return;
    try {
      await updateAsync(name, {
        provider: data.provider,
        model: data.model,
        displayName: data.displayName || null,
        systemPrompt: data.systemPrompt || null,
        temperature: data.temperature ? Number(data.temperature) : null,
        maxOutputTokens: data.maxOutputTokens ? Number(data.maxOutputTokens) : null,
        activated: data.activated,
      });
      toast.success(t('AI.Workspaces.SaveSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[AIWorkspaceEditPage] Failed to update workspace', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div data-slot="ai-workspace-edit-page" className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ai/workspaces">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('AI.Workspaces.BackToList')}
          </Link>
        </Button>
        <EmptyState icon={AlertCircle} message={t('AI.Workspaces.NotFound')} />
      </div>
    );
  }

  const isSystem = workspace.kind === AI_WORKSPACE_KINDS.SYSTEM;
  const isReadonly = isSystem || !canManage;

  const defaultValues: EditWorkspaceFormValues = {
    provider: workspace.provider,
    model: workspace.model,
    displayName: workspace.displayName ?? '',
    systemPrompt: workspace.systemPrompt ?? '',
    temperature: workspace.temperature ?? ('' as const),
    maxOutputTokens: workspace.maxOutputTokens ?? ('' as const),
    activated: workspace.activated,
  };

  return (
    <div data-slot="ai-workspace-edit-page" className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ai/workspaces">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('AI.Workspaces.BackToList')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-2xl font-semibold text-foreground font-mono">{workspace.key}</h2>
          <p className="text-sm text-muted-foreground">
            {workspace.provider} / {workspace.model}
          </p>
        </div>
        {isSystem && <Badge variant="outline">{t('AI.Workspaces.Kind.System')}</Badge>}
        <Badge variant={workspace.activated ? 'default' : 'secondary'}>
          {workspace.activated ? t('Common.Enabled') : t('Common.Disabled')}
        </Badge>
      </div>

      {isReadonly ? (
        <WorkspaceDetail workspace={workspace} />
      ) : (
        <WorkspaceForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/ai/workspaces')}
          isPending={isPending}
        />
      )}

      {workspace.activated && <WorkspaceTestPanel workspace={workspace} />}
    </div>
  );
}
