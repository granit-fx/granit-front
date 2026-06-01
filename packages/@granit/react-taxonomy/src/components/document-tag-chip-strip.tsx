import { useMemo, useState } from 'react';

import {
  useAttachTagToDocument,
  useDetachTagFromDocument,
  useDocumentTags,
} from '../hooks/use-document-tags';

import { TagAutocomplete } from './tag-autocomplete.tsx';
import { TagChip } from './tag-chip.tsx';

import type { TagChipStripLabels } from './tag-chip-strip.tsx';
import type { ReactNode } from 'react';

export interface DocumentTagChipStripProps {
  readonly scope: string;
  /** Documents API base path, e.g. `/api/v1` (NOT `/api/v1/taxonomy`). */
  readonly basePath: string;
  readonly documentId: string;
  readonly hideOnCardOnly?: boolean;
  readonly canManage?: boolean;
  readonly labels?: TagChipStripLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<TagChipStripLabels> = {
  add: '+ Tag',
  loading: 'Loading…',
  error: 'Failed to load tags.',
  empty: 'No tags.',
  placeholder: 'Add tag…',
  create: 'Create',
  remove: 'Remove',
};

/**
 * Documents-proxy variant of {@link TagChipStrip}. Same UX, different data
 * source: routes through `/api/v1/documents/{id}/tags` instead of the
 * canonical `/api/v1/taxonomy/tags/assignments` surface. The two share
 * the same canonical store on the backend, so changes in either path
 * propagate everywhere.
 *
 * Use this on the Documents detail page only. Anywhere else, prefer
 * {@link TagChipStrip} so the same scope/target shape works across modules.
 */
export function DocumentTagChipStrip({
  scope,
  basePath,
  documentId,
  hideOnCardOnly = true,
  canManage = false,
  labels,
  className,
}: DocumentTagChipStripProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [editing, setEditing] = useState(false);

  const bindings = { basePath, documentId };
  const tagsQuery = useDocumentTags(bindings);
  const attach = useAttachTagToDocument(bindings);
  const detach = useDetachTagFromDocument(bindings);

  const visible = useMemo(() => {
    const list = tagsQuery.data ?? [];
    return hideOnCardOnly ? list.filter((tag) => !tag.hideOnEntityCard) : list;
  }, [tagsQuery.data, hideOnCardOnly]);

  const value = useMemo(() => visible.map((tag) => tag.id), [visible]);

  if (tagsQuery.isLoading) {
    return (
      <div
        data-granit-document-tag-chip-strip=""
        data-granit-document-tag-chip-strip-loading=""
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }
  if (tagsQuery.isError) {
    return (
      <div
        data-granit-document-tag-chip-strip=""
        data-granit-document-tag-chip-strip-error=""
        role="alert"
        className={className}
      >
        {labelStrings.error}
      </div>
    );
  }

  return (
    <div data-granit-document-tag-chip-strip="" className={className}>
      {visible.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          onRemove={canManage ? () => detach.mutate(tag.id) : undefined}
          removeLabel={labelStrings.remove}
        />
      ))}
      {visible.length === 0 && !editing && (
        <span data-granit-document-tag-chip-strip-empty="">{labelStrings.empty}</span>
      )}
      {canManage && !editing && (
        <button
          type="button"
          data-granit-document-tag-chip-strip-add=""
          onClick={() => setEditing(true)}
        >
          {labelStrings.add}
        </button>
      )}
      {canManage && editing && (
        <TagAutocomplete
          scope={scope}
          value={value}
          canManage={canManage}
          onAdd={(tag) => attach.mutate(tag.id)}
          onRemove={(tag) => detach.mutate(tag.id)}
          labels={labelStrings}
        />
      )}
    </div>
  );
}
