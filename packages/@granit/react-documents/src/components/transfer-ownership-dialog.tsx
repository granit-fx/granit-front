import { useEffect, useRef, useState } from 'react';

import { useTransferDocumentOwner } from '../hooks/use-document-mutations';
import { useTransferFolderOwner } from '../hooks/use-folder-mutations';

import type { ChangeEvent, ReactNode } from 'react';

export interface TransferOwnershipDialogLabels {
  readonly title?: string;
  readonly description?: string;
  readonly currentOwner?: string;
  readonly newOwnerLabel?: string;
  readonly newOwnerPlaceholder?: string;
  readonly submit?: string;
  readonly submitting?: string;
  readonly cancel?: string;
  readonly close?: string;
  readonly successFlash?: string;
  readonly invalidGuid?: string;
}

export type TransferOwnershipTarget =
  | { readonly type: 'Document'; readonly id: string }
  | { readonly type: 'Folder'; readonly id: string };

export interface TransferOwnershipDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly target: TransferOwnershipTarget;
  /** Current owner id — shown for context (read-only). */
  readonly currentOwnerId?: string;
  /** Pre-fill the new owner field (e.g. when coming from a user picker). */
  readonly initialNewOwnerId?: string;
  readonly onSuccess?: (newOwnerId: string) => void;
  readonly labels?: TransferOwnershipDialogLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<TransferOwnershipDialogLabels> = {
  title: 'Transfer ownership',
  description:
    'Pick the user who should become the new owner. The previous owner keeps any explicit shares.',
  currentOwner: 'Current owner',
  newOwnerLabel: 'New owner (user id)',
  newOwnerPlaceholder: '00000000-0000-0000-0000-000000000000',
  submit: 'Transfer',
  submitting: 'Transferring…',
  cancel: 'Cancel',
  close: 'Close',
  successFlash: 'Ownership transferred.',
  invalidGuid: 'Enter a valid Guid.',
};

// RFC 4122 — accepts any version of UUID. We do not require v4 because the
// backend identifiers are not constrained to a single version.
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NIL_GUID = '00000000-0000-0000-0000-000000000000';

function isValidGuid(value: string): boolean {
  return GUID_PATTERN.test(value) && value.toLowerCase() !== NIL_GUID;
}

/**
 * Modal that drives `PUT /documents/{id}/owner` or `PUT /folders/{id}/owner`
 * based on `target.type`. Validates the new-owner Guid client-side (non-empty,
 * non-nil, RFC 4122 shape) so we don't even send obvious 422s. Server-side
 * errors surface verbatim in the `data-granit-transfer-ownership-error`
 * region — including the `detail` string the backend uses for the
 * tenant-root and trashed-target cases.
 *
 * The host owns whether the entry-point button is visible (gated by
 * `Documents.{Documents|Folders}.TransferOwnership`). This component does
 * not check permissions — only the wire payload.
 */
export function TransferOwnershipDialog({
  open,
  onClose,
  target,
  currentOwnerId,
  initialNewOwnerId,
  onSuccess,
  labels,
  className,
}: Readonly<TransferOwnershipDialogProps>): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState(initialNewOwnerId ?? '');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const transferDocument = useTransferDocumentOwner();
  const transferFolder = useTransferFolderOwner();
  const mutation = target.type === 'Document' ? transferDocument : transferFolder;

  useEffect(() => {
    if (open) {
      setDraft(initialNewOwnerId ?? '');
      setTouched(false);
      setServerError(null);
    }
  }, [open, initialNewOwnerId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        /* jsdom corner cases */
      }
      queueMicrotask(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleInput(event: ChangeEvent<HTMLInputElement>): void {
    setDraft(event.target.value);
    setServerError(null);
  }

  function handleSubmit(): void {
    setTouched(true);
    const trimmed = draft.trim();
    if (!isValidGuid(trimmed)) return;

    const request = { newOwnerId: trimmed };
    const onError = (err: Error): void => {
      setServerError(err.message);
    };
    const onDone = (): void => {
      onSuccess?.(trimmed);
      onClose();
    };

    if (target.type === 'Document') {
      transferDocument.mutate({ id: target.id, request }, { onSuccess: onDone, onError });
    } else {
      transferFolder.mutate({ id: target.id, request }, { onSuccess: onDone, onError });
    }
  }

  const trimmedDraft = draft.trim();
  const clientInvalid = touched && trimmedDraft.length > 0 && !isValidGuid(trimmedDraft);
  const submitDisabled = mutation.isPending || trimmedDraft.length === 0;

  return (
    <dialog
      ref={dialogRef}
      data-granit-transfer-ownership-dialog=""
      data-granit-transfer-ownership-target={target.type}
      aria-label={labelStrings.title}
      className={className}
      onClose={onClose}
      onCancel={onClose}
    >
      <header data-granit-transfer-ownership-header="">
        <h2>{labelStrings.title}</h2>
        <button
          type="button"
          data-granit-transfer-ownership-close=""
          aria-label={labelStrings.close}
          onClick={onClose}
        >
          ×
        </button>
      </header>

      <p data-granit-transfer-ownership-description="">{labelStrings.description}</p>

      {currentOwnerId && (
        <p data-granit-transfer-ownership-current="">
          <span>{labelStrings.currentOwner}</span>
          <code>{currentOwnerId}</code>
        </p>
      )}

      <label data-granit-transfer-ownership-field="">
        <span>{labelStrings.newOwnerLabel}</span>
        <input
          ref={inputRef}
          type="text"
          data-granit-transfer-ownership-input=""
          value={draft}
          aria-label={labelStrings.newOwnerLabel}
          aria-invalid={clientInvalid || serverError !== null}
          placeholder={labelStrings.newOwnerPlaceholder}
          onChange={handleInput}
          onBlur={() => setTouched(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />
      </label>

      {clientInvalid && (
        <div
          data-granit-transfer-ownership-error=""
          data-granit-transfer-ownership-error-source="client"
          role="alert"
        >
          {labelStrings.invalidGuid}
        </div>
      )}
      {serverError && !clientInvalid && (
        <div
          data-granit-transfer-ownership-error=""
          data-granit-transfer-ownership-error-source="server"
          role="alert"
        >
          {serverError}
        </div>
      )}

      <footer data-granit-transfer-ownership-footer="">
        <button
          type="button"
          data-granit-transfer-ownership-cancel=""
          onClick={onClose}
          disabled={mutation.isPending}
        >
          {labelStrings.cancel}
        </button>
        <button
          type="button"
          data-granit-transfer-ownership-submit=""
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          {mutation.isPending ? labelStrings.submitting : labelStrings.submit}
        </button>
      </footer>
    </dialog>
  );
}
