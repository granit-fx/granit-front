import { useTranslation } from '@granit/react-localization';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@granit/react-ui';
import { useFeatureRouteTable, useWorkspaces } from '@granit/react-workspaces';
import {
  type FeatureRouteTable,
  type WorkspaceItemResponse,
  type WorkspaceResponse,
} from '@granit/workspaces';
import { ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';

import { useActiveWorkspace } from './use-active-workspace';
import { WorkspaceIcon } from './workspace-icon';
import { resolveItemHref, resolveItemLabel, resolveLabel } from './workspace-utils';

function isLeafActive(
  item: WorkspaceItemResponse,
  currentPath: string,
  parentWorkspaceName: string,
  featureRoutes: FeatureRouteTable
): boolean {
  const href = resolveItemHref(item, parentWorkspaceName, featureRoutes);
  if (!href) return false;
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function isSubWorkspaceActive(
  sub: WorkspaceResponse,
  currentPath: string,
  workspaceHref: string,
  featureRoutes: FeatureRouteTable
): boolean {
  if (currentPath === workspaceHref || currentPath.startsWith(`${workspaceHref}/`)) return true;
  return sub.sections.some((s) =>
    s.items.some((item) => isLeafActive(item, currentPath, sub.name, featureRoutes))
  );
}

function LeafItem({
  item,
  currentPath,
  parentWorkspaceName,
  featureRoutes,
}: Readonly<{
  item: WorkspaceItemResponse;
  currentPath: string;
  parentWorkspaceName: string;
  featureRoutes: FeatureRouteTable;
}>) {
  const { t } = useTranslation();
  const label = resolveItemLabel(item, t);
  const href = resolveItemHref(item, parentWorkspaceName, featureRoutes);
  const isActive = isLeafActive(item, currentPath, parentWorkspaceName, featureRoutes);

  if (!href) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={label} disabled>
          <WorkspaceIcon name={item.icon} />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={label} isActive={isActive}>
        <NavLink to={href}>
          <WorkspaceIcon name={item.icon} />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SubWorkspaceGroup({
  parentItem,
  sub,
  currentPath,
  featureRoutes,
}: Readonly<{
  parentItem: WorkspaceItemResponse;
  sub: WorkspaceResponse;
  currentPath: string;
  featureRoutes: FeatureRouteTable;
}>) {
  const { t } = useTranslation();
  const label = resolveItemLabel(parentItem, t);
  const childItems = sub.sections.flatMap((s) => s.items);
  const workspaceHref = `/w/${encodeURIComponent(sub.name)}`;
  const isActive = isSubWorkspaceActive(sub, currentPath, workspaceHref, featureRoutes);

  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={label}>
            <WorkspaceIcon name={parentItem.icon ?? sub.icon} />
            <span>{label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {childItems.map((child, idx) => {
              const childHref = resolveItemHref(child, sub.name, featureRoutes);
              const childLabel = resolveItemLabel(child, t);
              const childIsActive = isLeafActive(child, currentPath, sub.name, featureRoutes);
              if (!childHref) {
                return (
                  <SidebarMenuSubItem key={`${child.kind}-${idx}`}>
                    <SidebarMenuSubButton aria-disabled className="opacity-50">
                      <span>{childLabel}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              }
              return (
                <SidebarMenuSubItem key={`${child.kind}-${idx}`}>
                  <SidebarMenuSubButton asChild isActive={childIsActive}>
                    <NavLink to={childHref}>
                      <span>{childLabel}</span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// Renders the active workspace's sections + items in the sidebar. When a
// section contains `SubWorkspace` items (e.g. `Granit.Framework` whose
// section lists the 8 framework shells), each sub-workspace is rendered
// as a collapsible group with its own items as children — the two-level
// cascading nav pattern Frappe / ERPNext uses for module-rich apps.
//
// Returns `null` when no active workspace is resolvable, so AppSidebar can
// fall back to its static nav for users who haven't picked a workspace.
export function WorkspaceContentNav() {
  const { t } = useTranslation();
  const { activeWorkspaceName } = useActiveWorkspace();
  const { data } = useWorkspaces();
  const location = useLocation();
  const featureRoutes = useFeatureRouteTable();

  if (!data?.workspaces || !activeWorkspaceName) return null;
  const workspace = data.workspaces.find((w) => w.name === activeWorkspaceName);
  if (!workspace) return null;

  const sectionsWithItems = workspace.sections.filter((s) => s.items.length > 0);
  if (sectionsWithItems.length === 0) return null;

  const findSub = (name: string) => data.workspaces.find((w) => w.name === name);

  return (
    <>
      {sectionsWithItems.map((section) => {
        const sectionLabel = section.displayKey
          ? resolveLabel(section.displayKey, section.key, t)
          : t('Workspace.Section.Default', 'Items');
        return (
          <SidebarGroup key={section.key} data-slot="workspace-content-section">
            <SidebarGroupLabel>{sectionLabel}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item, idx) => {
                if (item.kind === 'SubWorkspace' && item.subWorkspaceName) {
                  const sub = findSub(item.subWorkspaceName);
                  if (sub) {
                    return (
                      <SubWorkspaceGroup
                        key={`${item.kind}-${idx}`}
                        parentItem={item}
                        sub={sub}
                        currentPath={location.pathname}
                        featureRoutes={featureRoutes}
                      />
                    );
                  }
                }
                return (
                  <LeafItem
                    key={`${item.kind}-${idx}`}
                    item={item}
                    currentPath={location.pathname}
                    parentWorkspaceName={workspace.name}
                    featureRoutes={featureRoutes}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        );
      })}
    </>
  );
}
