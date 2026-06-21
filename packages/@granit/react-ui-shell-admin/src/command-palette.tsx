import { useEffect, useState } from 'react';

import { useTranslation } from '@granit/react-localization';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@granit/react-ui';
import { useFeatureRouteTable, useWorkspaces } from '@granit/react-workspaces';
import { buildWorkspaceUrl, type WorkspaceItemResponse } from '@granit/workspaces';
import { useNavigate } from 'react-router-dom';

import { OPEN_COMMAND_PALETTE_EVENT } from './command-palette-events';
import { useActiveWorkspace } from './use-active-workspace';
import { WorkspaceIcon } from './workspace-icon';
import { resolveItemHref, resolveItemLabel, resolveLabel } from './workspace-utils';

// Frappe-style global command palette — Ctrl+K / ⌘K opens a searchable
// modal that lists every workspace + every item across the tree, so the
// user can jump anywhere without first selecting a workspace via the
// switcher. Mounted once at the root of `Layout` so the shortcut works on
// every route, including the home launcher.
export function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useWorkspaces();
  const { setActiveWorkspace } = useActiveWorkspace();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpenEvent = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    globalThis.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener('keydown', onKey);
      globalThis.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  const featureRoutes = useFeatureRouteTable();
  const workspaces = (data?.workspaces ?? []).filter((w) => !w.isShell);

  // Flatten every navigable item across the tree, paired with its parent
  // workspace label so the user can disambiguate (e.g. "Party in Crm" vs
  // "Party in Accounting" — same entity, different preset).
  const allItems = (data?.workspaces ?? []).flatMap((workspace) =>
    workspace.sections.flatMap((section) => section.items.map((item) => ({ workspace, item })))
  );

  const handleSelectWorkspace = (name: string) => {
    setActiveWorkspace(name);
    navigate(buildWorkspaceUrl(name));
    setOpen(false);
  };

  const handleSelectItem = (workspace: { readonly name: string }, item: WorkspaceItemResponse) => {
    const href = resolveItemHref(item, workspace.name, featureRoutes);
    if (!href) return;
    setActiveWorkspace(workspace.name);
    if (href.startsWith('http://') || href.startsWith('https://')) {
      globalThis.open(href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(href);
    }
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('Command.Placeholder', 'Type a command or search…')} />
      <CommandList>
        <CommandEmpty>{t('Command.NoResults', 'No results found.')}</CommandEmpty>
        {workspaces.length > 0 && (
          <CommandGroup heading={t('Command.Group.Workspaces', 'Workspaces')}>
            {workspaces.map((workspace) => {
              const label = resolveLabel(workspace.displayKey, workspace.name, t);
              return (
                <CommandItem
                  key={`ws-${workspace.name}`}
                  value={`workspace ${label} ${workspace.name}`}
                  onSelect={() => handleSelectWorkspace(workspace.name)}
                >
                  <WorkspaceIcon name={workspace.icon} className="mr-2 size-4" />
                  <span>{label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {allItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('Command.Group.Items', 'Items')}>
              {allItems.map(({ workspace, item }, idx) => {
                const itemLabel = resolveItemLabel(item, t);
                const wsLabel = resolveLabel(workspace.displayKey, workspace.name, t);
                const href = resolveItemHref(item, workspace.name, featureRoutes);
                return (
                  <CommandItem
                    key={`item-${workspace.name}-${idx}`}
                    value={`${wsLabel} ${itemLabel} ${item.entityName ?? ''} ${href ?? ''}`}
                    disabled={!href}
                    onSelect={() => handleSelectItem(workspace, item)}
                  >
                    <WorkspaceIcon name={item.icon} className="mr-2 size-4" />
                    <span className="flex-1">{itemLabel}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{wsLabel}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
