import { useTranslation } from '@granit/react-localization';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@granit/react-ui';
import { useWorkspaces } from '@granit/react-workspaces';
import { buildWorkspaceUrl } from '@granit/workspaces';
import { Check, ChevronsUpDown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';

import { useActiveWorkspace } from './use-active-workspace';
import { WorkspaceIcon } from './workspace-icon';
import { resolveLabel } from './workspace-utils';

// Linear / Notion-style switcher: the active workspace name is permanently
// visible at the top of the sidebar, and clicking opens a flat popover that
// lists every workspace the user can see (filtered server-side via
// `/workspaces`). The active workspace is resolved via `useActiveWorkspace`
// (URL `/w/{name}/...` first, then a localStorage-persisted last-selection)
// so the indicator stays pinned even when the user navigates to a legacy
// route that doesn't carry the workspace prefix.
//
// The cascading 3-level menu pattern (à la Frappe / ERPNext) was deliberately
// rejected — it hides the active workspace until the user opens the menu,
// which contradicts the "one workspace at a time" rule the showcase enforces.
export function WorkspaceSwitcherMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useWorkspaces();
  const { activeWorkspaceName, setActiveWorkspace } = useActiveWorkspace();

  const activeWorkspace = activeWorkspaceName
    ? data?.workspaces?.find((w) => w.name === activeWorkspaceName)
    : undefined;
  // Framework shells are reached via the `Granit.Framework` workspace
  // (modal on the launcher / its own workspace page), not directly from
  // the switcher — keeps the list focused on app + framework roots.
  const switchableWorkspaces = (data?.workspaces ?? []).filter((w) => !w.isShell);

  const titleLabel = activeWorkspace
    ? resolveLabel(activeWorkspace.displayKey, activeWorkspace.name, t)
    : t('Common.AppName');
  const subtitleLabel = activeWorkspace
    ? t('Workspace.Switcher.AppName', 'Granit Showcase')
    : t('Workspace.Switcher.NoActive', 'No workspace selected');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              data-slot="workspace-switcher-trigger"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeWorkspace ? (
                  <WorkspaceIcon name={activeWorkspace.icon} className="size-4" />
                ) : (
                  <Shield className="size-4" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                <span className="truncate text-sm font-medium">{titleLabel}</span>
                <span className="truncate text-xs text-muted-foreground">{subtitleLabel}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={8}
            className="w-64"
            data-slot="workspace-switcher-content"
          >
            <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('Workspace.Switcher.Workspaces', 'Workspaces')}
            </DropdownMenuLabel>
            {isLoading && (
              <DropdownMenuItem disabled>
                {t('Workspace.Switcher.Loading', 'Loading…')}
              </DropdownMenuItem>
            )}
            {!isLoading && switchableWorkspaces.length === 0 && (
              <DropdownMenuItem disabled>
                {t('Workspace.Switcher.None', 'No workspaces available')}
              </DropdownMenuItem>
            )}
            {!isLoading &&
              switchableWorkspaces.length > 0 &&
              switchableWorkspaces.map((workspace) => {
                const label = resolveLabel(workspace.displayKey, workspace.name, t);
                const isActive = activeWorkspace?.name === workspace.name;
                return (
                  <DropdownMenuItem
                    key={workspace.name}
                    onClick={() => {
                      setActiveWorkspace(workspace.name);
                      navigate(buildWorkspaceUrl(workspace.name));
                    }}
                    data-active={isActive || undefined}
                    className="gap-2"
                  >
                    <WorkspaceIcon name={workspace.icon} className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {isActive && <Check className="size-4 text-primary" aria-hidden />}
                  </DropdownMenuItem>
                );
              })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/')}>
              {t('Workspace.Switcher.Home', 'Home')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
