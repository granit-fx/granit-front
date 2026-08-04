import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@granit/react-ui';
import { useWorkspaces } from '@granit/react-workspaces';
import { filterNavByPermission } from '@granit/shell-core';
import { ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';

import { useShellChrome, type ShellNavItem } from './shell-chrome-context';
import { useActiveWorkspace } from './use-active-workspace';
import { WorkspaceContentNav } from './workspace-content-nav';
import { WorkspaceSwitcherMenu } from './workspace-switcher-menu';

/**
 * Admin sidebar: workspace switcher, workspace-driven or static navigation, and
 * an app-supplied `userMenu` slot in the footer (kept app-side so each app
 * brings its own account menu / auth / routes).
 */
export function AppSidebar({
  userMenu,
  ...props
}: React.ComponentProps<typeof Sidebar> & { readonly userMenu?: React.ReactNode }) {
  const { t } = useTranslation();
  const { appKind, navModel, appVersion } = useShellChrome();
  const { mainNavigation, navGroups } = navModel;
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const { activeWorkspaceName } = useActiveWorkspace();
  const { data: workspacesData } = useWorkspaces(
    appKind === 'host' ? {} : { includeShells: false }
  );

  // Both apps prefer the workspace-driven nav whenever an active workspace
  // resolves to a workspace tree node with at least one item — that
  // includes the Framework root on the host (whose section lists the shells as
  // `SubWorkspace` items, rendered as collapsible groups). Falls back to
  // the static nav for users who haven't picked a workspace yet (fresh
  // visit landing on `/`).
  const useWorkspaceNav = (() => {
    if (!workspacesData?.workspaces || !activeWorkspaceName) return false;
    const ws = workspacesData.workspaces.find((w) => w.name === activeWorkspaceName);
    if (!ws) return false;
    return ws.sections.some((s) => s.items.length > 0);
  })();

  const visibleMainNavigation = filterNavByPermission(mainNavigation, hasPermission);

  const renderNavItem = (item: ShellNavItem) => {
    const isActive = item.children
      ? item.children.some(
          (child) =>
            location.pathname === child.href || location.pathname.startsWith(`${child.href}/`)
        )
      : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

    if (item.children) {
      return (
        <Collapsible key={item.href} asChild defaultOpen={isActive} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={t(item.titleKey)}>
                <item.icon />
                <span>{t(item.titleKey)}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={child.href}>
                    <SidebarMenuSubButton asChild isActive={location.pathname === child.href}>
                      <NavLink to={child.href}>
                        <span>{t(child.titleKey)}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild tooltip={t(item.titleKey)} isActive={isActive}>
          <NavLink to={item.href}>
            <item.icon />
            <span>{t(item.titleKey)}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" data-slot="app-sidebar" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcherMenu />
      </SidebarHeader>

      <SidebarContent className="scrollbar-overlay">
        {useWorkspaceNav ? (
          <WorkspaceContentNav />
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>{t('Header.AdminConsole', 'Admin Console')}</SidebarGroupLabel>
              <SidebarMenu>{visibleMainNavigation.map(renderNavItem)}</SidebarMenu>
            </SidebarGroup>

            {navGroups.map((group) => {
              const visibleItems = filterNavByPermission(group.items, hasPermission);
              if (visibleItems.length === 0) return null;
              return (
                <SidebarGroup key={group.labelKey}>
                  <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
                  <SidebarMenu>{visibleItems.map(renderNavItem)}</SidebarMenu>
                </SidebarGroup>
              );
            })}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {appVersion && (
          <p className="px-2 text-[10px] text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
            v{appVersion}
          </p>
        )}
        {userMenu}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
