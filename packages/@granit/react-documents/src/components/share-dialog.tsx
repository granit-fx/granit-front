import { useState } from 'react';

import {
  useGrantDocumentShare,
  useGrantFolderShare,
  useRevokeShare,
} from '../hooks/use-share-mutations';
import { useDocumentShares, useFolderShares } from '../hooks/use-shares';

import type {
  GrantShareRequest,
  ShareGranteeType,
  SharePermissionLevel,
  ShareResponse,
} from '@granit/documents';
import type { ReactNode } from 'react';

export interface ShareDialogLabels {
  readonly dialogTitle?: string;
  readonly granteeTypeHeader?: string;
  readonly granteeHeader?: string;
  readonly permissionHeader?: string;
  readonly expiresAtHeader?: string;
  readonly revoke?: string;
  readonly empty?: string;
  readonly addShare?: string;
  readonly granteeTypeUser?: string;
  readonly granteeTypeRole?: string;
  readonly granteeTypeGroup?: string;
  readonly permissionRead?: string;
  readonly permissionEdit?: string;
  readonly permissionManage?: string;
  readonly isDefault?: string;
  readonly grant?: string;
  readonly cancel?: string;
  readonly loading?: string;
}

export type ShareDialogTarget =
  | { readonly type: 'Folder'; readonly id: string }
  | { readonly type: 'Document'; readonly id: string };

export interface ShareDialogProps {
  readonly target: ShareDialogTarget;
  readonly canManage?: boolean;
  readonly labels?: ShareDialogLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<ShareDialogLabels> = {
  dialogTitle: 'Shares',
  granteeTypeHeader: 'Type',
  granteeHeader: 'Grantee',
  permissionHeader: 'Permission',
  expiresAtHeader: 'Expires',
  revoke: 'Revoke',
  empty: 'No shares yet.',
  addShare: 'Add share',
  granteeTypeUser: 'User',
  granteeTypeRole: 'Role',
  granteeTypeGroup: 'Group',
  permissionRead: 'Read',
  permissionEdit: 'Edit',
  permissionManage: 'Manage',
  isDefault: 'Inherit to children',
  grant: 'Grant',
  cancel: 'Cancel',
  loading: 'Loading shares…',
};

interface DraftShare {
  readonly granteeType: ShareGranteeType;
  readonly granteeId: string;
  readonly permission: SharePermissionLevel;
  readonly isDefault: boolean;
  readonly expiresAt: string;
}

const EMPTY_DRAFT: DraftShare = {
  granteeType: 'User',
  granteeId: '',
  permission: 'Read',
  isDefault: true,
  expiresAt: '',
};

/**
 * CRUD UI for the share ACL of a single folder or document. The dialog
 * branches on `target.type` to call the right list/grant hooks; revoke is
 * share-id based and shared between both flavours.
 *
 * The component renders inline (no portal/modal element) — apps wrap it
 * in their own dialog primitive when needed.
 */
export function ShareDialog({
  target,
  canManage = false,
  labels,
  className,
}: ShareDialogProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const folderShares = useFolderShares(target.type === 'Folder' ? target.id : '');
  const documentShares = useDocumentShares(target.type === 'Document' ? target.id : '');
  const query = target.type === 'Folder' ? folderShares : documentShares;

  const grantFolder = useGrantFolderShare();
  const grantDocument = useGrantDocumentShare();
  const revokeShare = useRevokeShare();

  const [draft, setDraft] = useState<DraftShare | null>(null);

  function startCreate(): void {
    setDraft(EMPTY_DRAFT);
  }

  function submitCreate(): void {
    if (!draft || draft.granteeId.trim().length === 0) return;
    const request: GrantShareRequest = {
      granteeType: draft.granteeType,
      granteeId: draft.granteeId.trim(),
      permission: draft.permission,
      isDefault: target.type === 'Folder' ? draft.isDefault : undefined,
      expiresAt: draft.expiresAt.length > 0 ? draft.expiresAt : null,
    };
    const onDone = (): void => {
      setDraft(null);
    };
    if (target.type === 'Folder') {
      grantFolder.mutate({ folderId: target.id, request }, { onSuccess: onDone });
    } else {
      grantDocument.mutate({ documentId: target.id, request }, { onSuccess: onDone });
    }
  }

  function handleRevoke(share: ShareResponse): void {
    revokeShare.mutate(share.id);
  }

  if (query.isLoading) {
    return (
      <div data-granit-share-dialog="" data-granit-share-dialog-loading="" className={className}>
        {labelStrings.loading}
      </div>
    );
  }

  const shares = query.data?.items ?? [];

  return (
    <div
      data-granit-share-dialog=""
      data-granit-share-dialog-target={target.type}
      className={className}
    >
      <header data-granit-share-dialog-header="">
        <h2>{labelStrings.dialogTitle}</h2>
        {canManage && (
          <button type="button" onClick={startCreate} disabled={draft !== null}>
            {labelStrings.addShare}
          </button>
        )}
      </header>

      {shares.length === 0 && draft === null ? (
        <div data-granit-share-dialog-empty="">{labelStrings.empty}</div>
      ) : (
        <table data-granit-share-dialog-table="">
          <thead>
            <tr>
              <th>{labelStrings.granteeTypeHeader}</th>
              <th>{labelStrings.granteeHeader}</th>
              <th>{labelStrings.permissionHeader}</th>
              <th>{labelStrings.expiresAtHeader}</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {shares.map((share) => (
              <tr key={share.id} data-granit-share-dialog-row="" data-granit-share-id={share.id}>
                <td>{share.granteeType}</td>
                <td>{share.granteeId}</td>
                <td>{share.permission}</td>
                <td>{share.expiresAt ?? ''}</td>
                {canManage && (
                  <td>
                    <button type="button" onClick={() => handleRevoke(share)}>
                      {labelStrings.revoke}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {draft && (
              <tr data-granit-share-dialog-row="" data-granit-share-dialog-draft="">
                <td>
                  <select
                    aria-label={labelStrings.granteeTypeHeader}
                    value={draft.granteeType}
                    onChange={(event) =>
                      setDraft({ ...draft, granteeType: event.target.value as ShareGranteeType })
                    }
                  >
                    <option value="User">{labelStrings.granteeTypeUser}</option>
                    <option value="Role">{labelStrings.granteeTypeRole}</option>
                    <option value="Group">{labelStrings.granteeTypeGroup}</option>
                  </select>
                </td>
                <td>
                  <input
                    aria-label={labelStrings.granteeHeader}
                    value={draft.granteeId}
                    onChange={(event) => setDraft({ ...draft, granteeId: event.target.value })}
                  />
                </td>
                <td>
                  <select
                    aria-label={labelStrings.permissionHeader}
                    value={draft.permission}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        permission: event.target.value as SharePermissionLevel,
                      })
                    }
                  >
                    <option value="Read">{labelStrings.permissionRead}</option>
                    <option value="Edit">{labelStrings.permissionEdit}</option>
                    <option value="Manage">{labelStrings.permissionManage}</option>
                  </select>
                </td>
                <td>
                  <input
                    type="datetime-local"
                    aria-label={labelStrings.expiresAtHeader}
                    value={draft.expiresAt}
                    onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })}
                  />
                </td>
                <td>
                  {target.type === 'Folder' && (
                    <label data-granit-share-dialog-default="">
                      <input
                        type="checkbox"
                        checked={draft.isDefault}
                        onChange={(event) =>
                          setDraft({ ...draft, isDefault: event.target.checked })
                        }
                      />
                      <span>{labelStrings.isDefault}</span>
                    </label>
                  )}
                  <button type="button" onClick={submitCreate}>
                    {labelStrings.grant}
                  </button>
                  <button type="button" onClick={() => setDraft(null)}>
                    {labelStrings.cancel}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
