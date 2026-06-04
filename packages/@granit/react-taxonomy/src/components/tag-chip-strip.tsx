import { useMemo, useState } from 'react';

import { useAssignTag, useUnassignTag } from '../hooks/use-tag-mutations';
import { useTags, useTagAssignments } from '../hooks/use-tags';

import { TagAutocomplete } from './tag-autocomplete.tsx';
import { TagChip } from './tag-chip.tsx';

import type { TagAutocompleteLabels } from './tag-autocomplete.tsx';
import type { TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

export interface TagChipStripLabels extends TagAutocompleteLabels {
  readonly add?: string;
  readonly loading?: string;
  readonly error?: string;
  readonly empty?: string;
}

export interface TagChipStripProps {
  readonly scope: string;
  readonly targetType: string;
  readonly targetId: string;
  /** Hide tags marked `hideOnEntityCard`. Default `true` on entity cards. */
  readonly hideOnCardOnly?: boolean;
  /** Show the `+` button to open the autocomplete. Gated on this flag *and* a non-empty target. */
  readonly canManage?: boolean;
  readonly labels?: TagChipStripLabels;
  readonly className?: string;
}

/** Default labels shared by {@link TagChipStrip} and `DocumentTagChipStrip`. */
export const DEFAULT_TAG_CHIP_STRIP_LABELS: Required<TagChipStripLabels> = {
  add: '+ Tag',
  loading: 'Loading…',
  error: 'Failed to load tags.',
  empty: 'No tags.',
  placeholder: 'Add tag…',
  create: 'Create',
  remove: 'Remove',
};

/**
 * Render the tag assignments for a polymorphic target. Reads via
 * {@link useTagAssignments}; the optional `+` button opens the
 * {@link TagAutocomplete} and wires {@link useAssignTag} /
 * {@link useUnassignTag} for chip add/remove.
 */
export function TagChipStrip({
  scope,
  targetType,
  targetId,
  hideOnCardOnly = true,
  canManage = false,
  labels,
  className,
}: TagChipStripProps): ReactNode {
  const labelStrings = { ...DEFAULT_TAG_CHIP_STRIP_LABELS, ...labels };
  const [editing, setEditing] = useState(false);

  const target = { targetType, targetId };
  const assignmentsQuery = useTagAssignments(target);
  const tagsQuery = useTags({ scope });
  const assign = useAssignTag();
  const unassign = useUnassignTag();

  const tags = useMemo<readonly TagResponse[]>(() => {
    const assignments = assignmentsQuery.data ?? [];
    const byId = new Map((tagsQuery.data ?? []).map((tag) => [tag.id, tag]));
    return assignments.flatMap((assignment) => {
      const tag = byId.get(assignment.tagId);
      if (!tag) return [];
      if (hideOnCardOnly && tag.hideOnEntityCard) return [];
      return [tag];
    });
  }, [assignmentsQuery.data, tagsQuery.data, hideOnCardOnly]);

  const value = useMemo(() => tags.map((tag) => tag.id), [tags]);

  if (assignmentsQuery.isLoading) {
    return (
      <div
        data-granit-tag-chip-strip=""
        data-granit-tag-chip-strip-loading=""
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }
  if (assignmentsQuery.isError) {
    return (
      <div
        data-granit-tag-chip-strip=""
        data-granit-tag-chip-strip-error=""
        role="alert"
        className={className}
      >
        {labelStrings.error}
      </div>
    );
  }

  return (
    <div data-granit-tag-chip-strip="" className={className}>
      {tags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          onRemove={canManage ? () => unassign.mutate({ tagId: tag.id, target }) : undefined}
          removeLabel={labelStrings.remove}
        />
      ))}
      {tags.length === 0 && !editing && (
        <span data-granit-tag-chip-strip-empty="">{labelStrings.empty}</span>
      )}
      {canManage && !editing && (
        <button type="button" data-granit-tag-chip-strip-add="" onClick={() => setEditing(true)}>
          {labelStrings.add}
        </button>
      )}
      {canManage && editing && (
        <TagAutocomplete
          scope={scope}
          value={value}
          canManage={canManage}
          onAdd={(tag) => assign.mutate({ tagId: tag.id, target })}
          onRemove={(tag) => unassign.mutate({ tagId: tag.id, target })}
          labels={labelStrings}
        />
      )}
    </div>
  );
}
