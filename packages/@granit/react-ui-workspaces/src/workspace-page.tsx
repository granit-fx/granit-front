
import { resolveLabel, useTranslation } from '@granit/react-localization';
import { Skeleton } from '@granit/react-ui';
import { useWorkspaces } from '@granit/react-workspaces';

import type { ReactNode } from 'react';

export interface WorkspacePageProps {
  /**
   * Workspace name from the route (`/w/:workspace`). App-agnostic: the host
   * wrapper reads it from the router (`useParams`) and passes it in, so this
   * page stays router-free and renders standalone in stories/tests.
   */
  readonly workspaceName: string | undefined;
  /**
   * Renders a workspace's icon from its backend icon name (a kebab-case lucide
   * name). Injected by the host — the showcase passes shell-admin's
   * `WorkspaceIcon` — so the package carries no icon-rendering dependency.
   */
  readonly renderIcon: (name: string | null, className?: string) => ReactNode;
}

/**
 * Workspace landing — a clean welcome screen reached by clicking a tile on the
 * launcher or a row in the switcher. The workspace's actual items (entities,
 * links, sub-workspaces) are surfaced in the sidebar nav, not on this page;
 * this is just a "you are here" landing while the user picks where to go from
 * the sidebar.
 */
export function WorkspacePage({ workspaceName, renderIcon }: WorkspacePageProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useWorkspaces();

  if (isLoading) {
    return (
      <div
        data-content-width="full"
        className="mx-auto flex max-w-3xl flex-col items-center gap-4 p-12"
      >
        <Skeleton className="size-20 rounded-2xl" />
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const workspace = data?.workspaces.find((w) => w.name === workspaceName);

  if (!workspace) {
    return (
      <div
        data-slot="workspace-page"
        data-content-width="full"
        className="mx-auto max-w-3xl space-y-2 p-6"
      >
        <h2 className="text-2xl font-semibold">
          {t('Workspace.NotFound.Title', 'Workspace not found')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('Workspace.NotFound.Body', 'No workspace named ')}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{workspaceName}</code>
          {t('Workspace.NotFound.BodySuffix', ' is registered for the current user.')}
        </p>
      </div>
    );
  }

  const title = resolveLabel(workspace.displayKey, workspace.name);

  return (
    <div
      data-slot="workspace-page"
      data-content-width="full"
      className="mx-auto flex max-w-3xl flex-col items-center gap-6 p-12 text-center"
    >
      <span className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        {renderIcon(workspace.icon, 'size-10')}
      </span>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {workspace.isShell
            ? t('Workspace.Shell.Subtitle', 'Framework shell — populated by module contributions.')
            : t('Workspace.App.Subtitle', 'Pick an item from the sidebar to get started.')}
        </p>
      </div>
    </div>
  );
}
