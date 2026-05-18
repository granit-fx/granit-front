import { isHexColor } from '@granit/taxonomy';
import { useState } from 'react';

import { useCreateTag, useDeleteTag, useUpdateTag } from '../hooks/use-tag-mutations.js';
import { useTags } from '../hooks/use-tags.js';

import { TagChip } from './tag-chip.tsx';

import type { CreateTagRequest, HexColor, TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

export interface TagManagerLabels {
  readonly title?: string;
  readonly newTag?: string;
  readonly nameHeader?: string;
  readonly colorHeader?: string;
  readonly hideHeader?: string;
  readonly actionsHeader?: string;
  readonly hideTooltip?: string;
  readonly delete?: string;
  readonly deleteConfirm?: string;
  readonly invalidColor?: string;
  readonly nameRequired?: string;
  readonly nameConflict?: string;
  readonly empty?: string;
  readonly readonlyHint?: string;
  readonly create?: string;
  readonly cancel?: string;
}

export interface TagManagerProps {
  readonly scope: string;
  /** Permission gate. When false, the table renders read-only. */
  readonly canManage?: boolean;
  readonly labels?: TagManagerLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<TagManagerLabels> = {
  title: 'Tags',
  newTag: 'New tag',
  nameHeader: 'Name',
  colorHeader: 'Color',
  hideHeader: 'Hidden on cards',
  actionsHeader: 'Actions',
  hideTooltip: 'Hide this tag from entity cards while keeping it in admin views.',
  delete: 'Delete',
  deleteConfirm: 'Delete this tag? All assignments will be removed.',
  invalidColor: 'Color must be a 7-character hex (e.g. #1A2B3C).',
  nameRequired: 'Name is required.',
  nameConflict: 'A tag with this name already exists.',
  empty: 'No tags yet — create the first one.',
  readonlyHint: 'You don’t have permission to manage tags.',
  create: 'Create',
  cancel: 'Cancel',
};

const NEW_TAG_DEFAULT_COLOR: HexColor = '#94a3b8';

interface DraftTag {
  readonly name: string;
  readonly color: string;
  readonly hideOnEntityCard: boolean;
}

const EMPTY_DRAFT: DraftTag = {
  name: '',
  color: NEW_TAG_DEFAULT_COLOR,
  hideOnEntityCard: false,
};

/**
 * Per-scope tag administration: CRUD + color picker + HideOnEntityCard
 * toggle. Headless — apps style via `className` and the
 * `data-granit-tag-manager*` attributes. When `canManage` is false the
 * table renders read-only with a permission hint.
 */
export function TagManager({
  scope,
  canManage = false,
  labels,
  className,
}: TagManagerProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const tagsQuery = useTags({ scope });
  const createTag = useCreateTag(scope);
  const updateTag = useUpdateTag(scope);
  const deleteTag = useDeleteTag(scope);

  const [draft, setDraft] = useState<DraftTag | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  function startCreate(): void {
    setDraft(EMPTY_DRAFT);
    setDraftError(null);
  }

  function submitCreate(): void {
    if (!draft) return;
    if (draft.name.trim().length === 0) {
      setDraftError(labelStrings.nameRequired);
      return;
    }
    if (!isHexColor(draft.color)) {
      setDraftError(labelStrings.invalidColor);
      return;
    }
    const request: CreateTagRequest = {
      scope,
      name: draft.name.trim(),
      color: draft.color,
      hideOnEntityCard: draft.hideOnEntityCard,
    };
    createTag.mutate(request, {
      onSuccess: () => {
        setDraft(null);
        setDraftError(null);
      },
      onError: (error) => {
        const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
        setDraftError(status === 409 ? labelStrings.nameConflict : error.message || null);
      },
    });
  }

  function patchTag(tag: TagResponse, patch: Partial<TagResponse>): void {
    if (patch.color !== undefined && !isHexColor(patch.color)) return;
    updateTag.mutate({
      id: tag.id,
      request: {
        name: patch.name,
        color: patch.color,
        hideOnEntityCard: patch.hideOnEntityCard,
      },
    });
  }

  function confirmDelete(tag: TagResponse): void {
    if (globalThis.window !== undefined && !globalThis.confirm(labelStrings.deleteConfirm)) return;
    deleteTag.mutate(tag.id);
  }

  if (tagsQuery.isLoading) {
    return (
      <div data-granit-tag-manager="" data-granit-tag-manager-loading="" className={className}>
        Loading…
      </div>
    );
  }
  if (tagsQuery.isError) {
    return (
      <div
        data-granit-tag-manager=""
        data-granit-tag-manager-error=""
        role="alert"
        className={className}
      >
        {tagsQuery.error?.message ?? 'Failed to load tags.'}
      </div>
    );
  }

  const tags = tagsQuery.data ?? [];

  return (
    <div data-granit-tag-manager="" data-granit-tag-manager-scope={scope} className={className}>
      <header data-granit-tag-manager-header="">
        <h2>{labelStrings.title}</h2>
        {canManage ? (
          <button
            type="button"
            data-granit-tag-manager-new=""
            onClick={startCreate}
            disabled={draft !== null}
          >
            {labelStrings.newTag}
          </button>
        ) : (
          <span data-granit-tag-manager-readonly-hint="">{labelStrings.readonlyHint}</span>
        )}
      </header>

      {tags.length === 0 && draft === null && (
        <div data-granit-tag-manager-empty="">{labelStrings.empty}</div>
      )}

      {(tags.length > 0 || draft !== null) && (
        <table data-granit-tag-manager-table="">
          <thead>
            <tr>
              <th>{labelStrings.nameHeader}</th>
              <th>{labelStrings.colorHeader}</th>
              <th title={labelStrings.hideTooltip}>{labelStrings.hideHeader}</th>
              {canManage && <th>{labelStrings.actionsHeader}</th>}
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} data-granit-tag-manager-row="" data-granit-tag-id={tag.id}>
                <td data-granit-tag-manager-name="">
                  {canManage ? (
                    <input
                      defaultValue={tag.name}
                      aria-label={labelStrings.nameHeader}
                      onBlur={(event) => {
                        const next = event.target.value.trim();
                        if (next.length > 0 && next !== tag.name) {
                          patchTag(tag, { name: next });
                        }
                      }}
                    />
                  ) : (
                    <TagChip tag={tag} />
                  )}
                </td>
                <td data-granit-tag-manager-color="">
                  {canManage ? (
                    <input
                      type="color"
                      aria-label={labelStrings.colorHeader}
                      defaultValue={tag.color}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (isHexColor(next) && next !== tag.color) {
                          patchTag(tag, { color: next });
                        }
                      }}
                    />
                  ) : (
                    <span style={{ backgroundColor: tag.color }} data-granit-tag-color-swatch="">
                      {tag.color}
                    </span>
                  )}
                </td>
                <td data-granit-tag-manager-hide="">
                  <input
                    type="checkbox"
                    aria-label={labelStrings.hideHeader}
                    defaultChecked={tag.hideOnEntityCard}
                    disabled={!canManage}
                    onChange={(event) => patchTag(tag, { hideOnEntityCard: event.target.checked })}
                  />
                </td>
                {canManage && (
                  <td data-granit-tag-manager-actions="">
                    <button type="button" onClick={() => confirmDelete(tag)}>
                      {labelStrings.delete}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {draft !== null && (
              <tr data-granit-tag-manager-row="" data-granit-tag-manager-draft="">
                <td>
                  <input
                    aria-label={labelStrings.nameHeader}
                    autoFocus
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="color"
                    aria-label={labelStrings.colorHeader}
                    value={draft.color}
                    onChange={(event) => setDraft({ ...draft, color: event.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    aria-label={labelStrings.hideHeader}
                    checked={draft.hideOnEntityCard}
                    onChange={(event) =>
                      setDraft({ ...draft, hideOnEntityCard: event.target.checked })
                    }
                  />
                </td>
                <td>
                  <button type="button" onClick={submitCreate} disabled={createTag.isPending}>
                    {labelStrings.create}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setDraftError(null);
                    }}
                  >
                    {labelStrings.cancel}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {draftError && (
        <div data-granit-tag-manager-draft-error="" role="alert">
          {draftError}
        </div>
      )}
    </div>
  );
}
