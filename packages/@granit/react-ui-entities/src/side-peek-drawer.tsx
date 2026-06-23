import { useCallback } from 'react';

import type { EntityRelationManifest } from '@granit/entities';
import { useTranslation } from '@granit/react-localization';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@granit/react-ui';
import { useSidePeek } from '@granit/react-workspaces';
import { useLocation, useNavigate } from 'react-router-dom';

import { EntityDetailContent } from './entity-detail-content';

// Notion-style side peek drawer — globally mounted in `<Layout />` so any
// list page can pop a row's detail without leaving the list. Driven by
// `useSidePeek` from `@granit/react-workspaces`, which keeps the peek
// stack in the URL's `?peek=` parameter (router-agnostic). The drawer
// renders the top-of-stack entry through `<EntityDetailContent />` —
// same body the dedicated detail route uses, so any manifest improvement
// shows up in both places.
//
// Keyboard shortcuts inherited from the hook:
// - `Esc` closes the top peek
// - `⌘+⇧+.` (or `Ctrl+Shift+.`) expands to the full detail page
export interface SidePeekDrawerProps {
  /**
   * Active workspace name — the host reads it from its workspace context
   * (e.g. `useActiveWorkspace()` in shell-admin) and passes it so the drawer
   * can build cross-entity peek links. Without it, relation links fall back
   * to opening the full detail page.
   */
  readonly activeWorkspaceName?: string | null;
}

export function SidePeekDrawer({ activeWorkspaceName }: SidePeekDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const onSearchChange = useCallback(
    (next: string) => navigate({ pathname: location.pathname, search: next }, { replace: true }),
    [navigate, location.pathname]
  );
  const onExpand = useCallback((fullPath: string) => navigate(fullPath), [navigate]);

  const { peek, closePeek } = useSidePeek({
    search: location.search,
    onSearchChange,
    onExpand,
  });

  const handleRelationClick = (relation: EntityRelationManifest) => {
    if (!peek) return;
    if (activeWorkspaceName) {
      navigate(
        `/w/${encodeURIComponent(activeWorkspaceName)}/${encodeURIComponent(relation.targetEntityName)}?source=${encodeURIComponent(peek.entityId)}`
      );
    }
    closePeek();
  };

  return (
    <Sheet open={peek !== null} onOpenChange={(open) => !open && closePeek()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
        data-slot="side-peek-drawer"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">{t('SidePeek.Title', 'Quick view')}</SheetTitle>
          <SheetDescription className="sr-only">
            {t(
              'SidePeek.Description',
              'Read-only side panel showing the selected row. Press Esc to close, or ⌘+⇧+. to expand.'
            )}
          </SheetDescription>
        </SheetHeader>
        {peek && (
          <div className="px-4 pb-6">
            <EntityDetailContent
              entityName={peek.entityName}
              entityId={peek.entityId}
              workspace={activeWorkspaceName}
              onRelationClick={handleRelationClick}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
