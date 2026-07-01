import {
  EntityDetail,
  useEntity,
  useEntityActionDrawer,
  useEntityMetadata,
} from '@granit/react-entities';
import { useTranslation } from '@granit/react-localization';
import {
  Skeleton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@granit/react-ui';

import { useEntityActionScope } from './entity-action-scope';

// ---------------------------------------------------------------------------
// Drawer host UI — paired with `<EntityActionDrawerHost>` from the framework.
// The framework holds the active overlay state (`{ action, rowId, row }`);
// the host scope context carries the active entity name (set by the workspace
// list page on mount). Body branches on `action.urlTemplate`:
//
//   - `null`  → render the entity's `details["default"]` for the row, fetched
//               through the standard manifest + entity GET endpoint.
//   - else    → fetch the resolved URL (with `{id}` substituted) and render
//               the response as raw text — wizards / server-rendered overlays.
// ---------------------------------------------------------------------------

export function ActionDrawer() {
  const { t } = useTranslation();
  const drawer = useEntityActionDrawer();
  const scope = useEntityActionScope();
  const open = drawer.current !== null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) drawer.close();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {drawer.current?.action.displayKey
              ? t(drawer.current.action.displayKey, drawer.current.action.name)
              : (drawer.current?.action.name ?? t('Common.Drawer', 'Drawer'))}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t(
              'ActionDrawer.Description',
              'Action panel for the selected row. Press Esc to close.'
            )}
          </SheetDescription>
        </SheetHeader>
        {drawer.current && (
          <div className="overflow-y-auto px-4 pb-6">
            {drawer.current.action.urlTemplate === null ? (
              <DrawerEntityDetail rowId={drawer.current.rowId} entityName={scope.entityName} />
            ) : (
              <DrawerUrlContent
                template={drawer.current.action.urlTemplate}
                rowId={drawer.current.rowId}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface DrawerEntityDetailProps {
  readonly rowId: string | null;
  readonly entityName: string | null;
}

function DrawerEntityDetail({ rowId, entityName }: DrawerEntityDetailProps) {
  const { t } = useTranslation();
  const { data: manifest, isLoading: manifestLoading } = useEntityMetadata(entityName ?? '');

  // Action-overlay reads hang off `/api/v1/{entityName}`; PascalCase-keyed
  // for `<EntityDetail>`.
  const { data: pascalValues, isLoading: valuesLoading } = useEntity(entityName ?? '', rowId, {
    basePath: entityName ? `/api/v1/${entityName}` : null,
    pascalCase: true,
  });

  if (!entityName || !rowId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('Common.SelectionAction.NoRow', 'No row context.')}
      </p>
    );
  }
  if (manifestLoading || valuesLoading) {
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  const variant = manifest?.details?.[0];
  if (!manifest || !variant || !pascalValues) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('Common.SelectionAction.NoDetail', 'No details available.')}
      </p>
    );
  }
  return (
    <EntityDetail
      variant={variant}
      values={pascalValues}
      formVariants={manifest.forms ?? []}
      entityName={entityName}
      entityId={rowId}
    />
  );
}

interface DrawerUrlContentProps {
  readonly template: string;
  readonly rowId: string | null;
}

// Server-rendered overlay flow — the URL is loaded in a sandboxed iframe
// rather than embedded as HTML. This avoids parsing untrusted markup as
// the host's DOM (XSS) while still letting the backend ship a wizard
// page or custom overlay. Apps that need richer wiring (postMessage
// handshake, auth headers) replace this whole component via a `dispatch`
// override on `useEntityActionDispatcher`.
function DrawerUrlContent({ template, rowId }: DrawerUrlContentProps) {
  const url = rowId ? template.replaceAll('{id}', encodeURIComponent(rowId)) : template;
  return (
    <iframe
      data-granit-action-drawer-url-frame
      src={url}
      title="Drawer content"
      sandbox="allow-forms allow-same-origin allow-scripts"
      className="h-[calc(100vh-8rem)] w-full border-0"
    />
  );
}
