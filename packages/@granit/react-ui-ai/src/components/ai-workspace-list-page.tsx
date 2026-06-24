import { AI_WORKSPACE_KINDS, AIPermissions } from '@granit/ai';
import { useAIWorkspaces, useDeleteAIWorkspace } from '@granit/react-ai';
import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import { toast, Badge, Button, Card, CardContent, Spinner } from '@granit/react-ui';
import { ViewSwitcher } from '@granit/react-ui-kit';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logger } from '../logger';

import { createWorkspaceColumns } from './workspace-columns';
import { WorkspaceDeleteDialog } from './workspace-delete-dialog';
import { WorkspaceTable } from './workspace-table';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { ViewMode } from '@granit/react-ui-kit';

export function AIWorkspaceListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useAIWorkspaces();
  const { removeAsync, isPending: isDeleting } = useDeleteAIWorkspace();

  const { hasPermission } = usePermissions();
  const canManage = hasPermission(AIPermissions.Workspaces.Manage);

  const [view, setView] = useState<ViewMode>('list');
  const [deleteTarget, setDeleteTarget] = useState<AIWorkspaceResponse | null>(null);

  const columns = useMemo(
    () =>
      createWorkspaceColumns({
        t,
        onView: (ws) => navigate(`/ai/workspaces/${ws.key}`),
        onEdit: (ws) => navigate(`/ai/workspaces/${ws.key}`),
        onDelete: (ws) => setDeleteTarget(ws),
        canManage,
      }),
    [t, navigate, canManage]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeAsync(deleteTarget.key);
      toast.success(t('AI.Workspaces.DeleteSuccess'));
      setDeleteTarget(null);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[AIWorkspaceListPage] Failed to delete workspace', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const workspaces = data?.workspaces ?? [];

  return (
    <div data-slot="ai-workspace-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('AI.Workspaces.Title')}</h2>
          <p className="text-sm text-muted-foreground">{t('AI.Workspaces.Description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onViewChange={setView} />
          {canManage && (
            <Button onClick={() => navigate('/ai/workspaces/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('AI.Workspaces.Create')}
            </Button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <WorkspaceTable
          data={workspaces}
          columns={columns}
          onRowClick={(ws) => navigate(`/ai/workspaces/${ws.key}`)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Card
              key={ws.key}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => navigate(`/ai/workspaces/${ws.key}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-sm font-medium">{ws.key}</p>
                    <p className="text-xs text-muted-foreground">
                      {ws.provider} / {ws.model}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={ws.activated ? 'default' : 'secondary'}>
                      {ws.activated ? t('Common.Enabled') : t('Common.Disabled')}
                    </Badge>
                    {ws.kind === AI_WORKSPACE_KINDS.SYSTEM && (
                      <Badge variant="outline">{t('AI.Workspaces.Kind.System')}</Badge>
                    )}
                  </div>
                </div>
                {ws.systemPrompt && (
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                    {ws.systemPrompt}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  {(ws.kind === AI_WORKSPACE_KINDS.SYSTEM || canManage) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/ai/workspaces/${ws.key}`);
                      }}
                    >
                      {ws.kind === AI_WORKSPACE_KINDS.SYSTEM || !canManage
                        ? t('Common.View')
                        : t('Common.Edit')}
                    </Button>
                  )}
                  {ws.kind !== AI_WORKSPACE_KINDS.SYSTEM && canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(ws);
                      }}
                    >
                      {t('Common.Delete')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WorkspaceDeleteDialog
        workspace={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}
