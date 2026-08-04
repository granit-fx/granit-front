import { useTranslation } from '@granit/react-localization';
import { Skeleton } from '@granit/react-ui';
import { useWorkspaces } from '@granit/react-workspaces';
import { buildWorkspaceUrl, type WorkspaceResponse } from '@granit/workspaces';
import { useNavigate } from 'react-router';

import { useActiveWorkspace } from './use-active-workspace';
import { WorkspaceIcon } from './workspace-icon';
import { resolveLabel } from './workspace-utils';

function WorkspaceTile({
  workspace,
  onSelect,
}: {
  readonly workspace: WorkspaceResponse;
  readonly onSelect: (ws: WorkspaceResponse) => void;
}) {
  const { t } = useTranslation();
  const label = resolveLabel(workspace.displayKey, workspace.name, t);
  return (
    <button
      type="button"
      onClick={() => onSelect(workspace)}
      data-slot="host-home-tile"
      className="group flex w-28 flex-col items-center gap-3 rounded-xl p-3 text-center transition-colors focus-visible:bg-accent focus-visible:outline-none"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105 group-hover:shadow-md">
        <WorkspaceIcon name={workspace.icon} className="size-8" />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

// Frappe / Odoo-style "app launcher" landing page — visiting `/` shows a
// grid of workspace tiles. Clicking a tile *selects* the workspace (so the
// top-left switcher updates and the sidebar starts rendering its items)
// and navigates to `/w/{name}`. The workspace's own items are surfaced in
// the sidebar nav, not on this page.
//
// Framework shells (`isShell:true`) are reached through the
// `Granit.Framework` workspace tile, not directly — keeps the home grid
// focused on app workspaces + framework root.
function renderHostHomeBody({
  isLoading,
  launcherWorkspaces,
  handleSelect,
  t,
}: {
  readonly isLoading: boolean;
  readonly launcherWorkspaces: readonly WorkspaceResponse[];
  readonly handleSelect: (ws: WorkspaceResponse) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap justify-center gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={`s-${i}`} className="h-28 w-28 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (launcherWorkspaces.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t('Home.Empty', 'No workspaces are registered for the current user.')}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-6" data-slot="host-home-grid">
      {launcherWorkspaces.map((workspace) => (
        <WorkspaceTile key={workspace.name} workspace={workspace} onSelect={handleSelect} />
      ))}
    </div>
  );
}

export function HostHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useWorkspaces();
  const { setActiveWorkspace } = useActiveWorkspace();

  const launcherWorkspaces = (data?.workspaces ?? []).filter((w) => !w.isShell);

  const handleSelect = (ws: WorkspaceResponse) => {
    setActiveWorkspace(ws.name);
    navigate(buildWorkspaceUrl(ws.name));
  };

  return (
    <div
      data-slot="host-home-page"
      data-content-width="full"
      className="mx-auto max-w-6xl space-y-10 p-6 lg:p-12"
    >
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t('Home.Title', 'Granit Showcase')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('Home.Subtitle', 'Choose a workspace to get started.')}
        </p>
      </header>

      {renderHostHomeBody({ isLoading, launcherWorkspaces, handleSelect, t })}
    </div>
  );
}
