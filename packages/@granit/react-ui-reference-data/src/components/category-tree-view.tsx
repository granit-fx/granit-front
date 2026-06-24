import { useTranslation } from '@granit/react-localization';
import { Badge, Spinner } from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-admin-kit';
import { cn } from '@granit/utils';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import type { ReferenceDataEntry } from './types';
import type { UseQueryResult } from '@tanstack/react-query';

interface CategoryTreeViewProps {
  /** Root entries (parentCode === null). */
  readonly roots: ReferenceDataEntry[];
  readonly isLoading?: boolean;
  /** Hook to fetch children for a given parent code. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly useChildren: (parentCode: string, options: any) => UseQueryResult<ReferenceDataEntry[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly apiClient: any;
  readonly onSelect: (code: string) => void;
  readonly i18nPrefix?: string;
}

export function CategoryTreeView({
  roots,
  isLoading,
  useChildren,
  apiClient,
  onSelect,
  i18nPrefix = 'ReferenceData.Common',
}: CategoryTreeViewProps) {
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (roots.length === 0) {
    return <EmptyState />;
  }

  return (
    <div data-slot="category-tree-view" className="space-y-1">
      {roots.map((root) => (
        <TreeNode
          key={root.code}
          entry={root}
          depth={0}
          useChildren={useChildren}
          apiClient={apiClient}
          onSelect={onSelect}
          i18nPrefix={i18nPrefix}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  readonly entry: ReferenceDataEntry;
  readonly depth: number;
  readonly useChildren: CategoryTreeViewProps['useChildren'];
  readonly apiClient: unknown;
  readonly onSelect: (code: string) => void;
  readonly i18nPrefix: string;
}

function TreeNode({ entry, depth, useChildren, apiClient, onSelect, i18nPrefix }: TreeNodeProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);

  const childrenQuery = useChildren(entry.code, {
    client: apiClient,
    enabled: expanded,
  });

  const children = childrenQuery.data ?? [];
  const hasChildren = expanded ? children.length > 0 : true; // Assume expandable until proven otherwise

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 cursor-pointer',
          !entry.activated && 'opacity-60'
        )}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren && (
            <ChevronRight
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                expanded && 'rotate-90'
              )}
            />
          )}
        </button>
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => onSelect(entry.code)}
        >
          <span className="font-mono text-xs font-medium">{entry.code}</span>
          <span className="text-muted-foreground">{entry.labelEn}</span>
          {!entry.activated && (
            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px]">
              {t(`${i18nPrefix}.Status.Inactive`)}
            </Badge>
          )}
        </button>
      </div>

      {expanded && childrenQuery.isLoading && (
        <div
          className="flex items-center justify-center py-2"
          style={{ paddingLeft: `${(depth + 1) * 24 + 8}px` }}
        >
          <Spinner size="sm" />
        </div>
      )}

      {expanded &&
        children.map((child) => (
          <TreeNode
            key={child.code}
            entry={child}
            depth={depth + 1}
            useChildren={useChildren}
            apiClient={apiClient}
            onSelect={onSelect}
            i18nPrefix={i18nPrefix}
          />
        ))}
    </div>
  );
}
