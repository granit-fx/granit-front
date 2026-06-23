import { useGranitClient } from '@granit/react-api-client';
import {
  EntityForm,
  useEntityActionModal,
  useEntityMetadata,
  useSelection,
} from '@granit/react-entities';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@granit/react-ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useEntityActionScope } from './entity-action-scope';

import type { EntityFormManifest } from '@granit/entities';

// ---------------------------------------------------------------------------
// Modal host UI — paired with `<EntityActionModalHost>`. Body branches on
// `action.urlTemplate`:
//
//   - `null`  → render the entity's `forms["default"]` for the row (or a
//               blank form for header / bulk actions).
//   - else    → load the resolved URL in a sandboxed iframe. For
//               `OnSelection` actions the rowId is `null`; the host
//               forwards `?ids=<csv>` so the server can apply the action
//               to every selected record.
// ---------------------------------------------------------------------------

function renderModalBody(
  modalState: NonNullable<ReturnType<typeof useEntityActionModal>['current']>,
  resolvedUrl: string | null,
  entityName: string | null,
  t: ReturnType<typeof useTranslation>['t']
) {
  if (modalState.action.urlTemplate === null) {
    return <ModalEntityForm rowId={modalState.rowId} entityName={entityName} />;
  }
  if (resolvedUrl) {
    return (
      <iframe
        data-slot="action-modal"
        data-granit-action-modal-url-frame
        src={resolvedUrl}
        title="Modal content"
        sandbox="allow-forms allow-same-origin allow-scripts"
        className="h-[60vh] w-full border-0"
      />
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      {t('Common.SelectionAction.NoUrl', 'No URL available.')}
    </p>
  );
}

export function ActionModal() {
  const { t } = useTranslation();
  const modal = useEntityActionModal();
  const scope = useEntityActionScope();
  const selection = useSelection();
  const open = modal.current !== null;

  const resolvedUrl = (() => {
    if (!modal.current?.action.urlTemplate) return null;
    const template = modal.current.action.urlTemplate;
    if (template.includes('{id}')) {
      return modal.current.rowId
        ? template.replaceAll('{id}', encodeURIComponent(modal.current.rowId))
        : null;
    }
    // Bulk-mode (`OnSelection` + `OpenModal`) — pass the active selection
    // ids as a CSV query parameter so the server can apply the action to
    // each one.
    if (selection.size > 0) {
      const ids = Array.from(selection.selectedIds).join(',');
      const separator = template.includes('?') ? '&' : '?';
      return `${template}${separator}ids=${encodeURIComponent(ids)}`;
    }
    return template;
  })();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) modal.close();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {modal.current?.action.displayKey
              ? t(modal.current.action.displayKey, modal.current.action.name)
              : (modal.current?.action.name ?? t('Common.Modal', 'Modal'))}
          </DialogTitle>
          {modal.current?.action.confirmationKey && (
            <DialogDescription>
              {t(
                modal.current.action.confirmationKey,
                t('Common.SelectionAction.ConfirmDefault', 'Please confirm the action.')
              )}
            </DialogDescription>
          )}
        </DialogHeader>
        {modal.current && (
          <div className="max-h-[70vh] overflow-y-auto">
            {renderModalBody(modal.current, resolvedUrl, scope.entityName, t)}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => modal.close()}>
            {t('Common.Close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ModalEntityFormProps {
  readonly rowId: string | null;
  readonly entityName: string | null;
}

function ModalEntityForm({ rowId, entityName }: ModalEntityFormProps) {
  const { t } = useTranslation();
  const client = useGranitClient();
  const { data: manifest, isLoading: manifestLoading } = useEntityMetadata(entityName ?? '');

  const { data: initial, isLoading: valuesLoading } = useQuery<Readonly<Record<string, unknown>>>({
    queryKey: ['entity-action-modal', entityName, rowId],
    queryFn: async () => {
      const response = await client.get<Readonly<Record<string, unknown>>>(
        `/api/v1/${entityName}/${encodeURIComponent(rowId ?? '')}`
      );
      return Object.fromEntries(
        Object.entries(response.data).map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1), v])
      );
    },
    enabled: Boolean(entityName) && Boolean(rowId),
  });

  if (!entityName) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('Common.SelectionAction.NoEntity', 'No entity scope available.')}
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
  const variant = manifest?.forms?.[0];
  if (!variant) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('Common.SelectionAction.NoForm', 'No form variant available.')}
      </p>
    );
  }
  // Mount the controlled form once the initial values land. Keying on
  // `rowId` discards local state when the modal switches rows, so the
  // useState initializer can seed from `initial` without a syncing
  // effect.
  return <ModalEntityFormBody key={rowId ?? 'new'} variant={variant} initial={initial ?? {}} />;
}

interface ModalEntityFormBodyProps {
  readonly variant: EntityFormManifest;
  readonly initial: Readonly<Record<string, unknown>>;
}

function ModalEntityFormBody({ variant, initial }: ModalEntityFormBodyProps) {
  const [values, setValues] = useState<Readonly<Record<string, unknown>>>(() => initial);
  return <EntityForm variant={variant} values={values} onChange={setValues} />;
}
