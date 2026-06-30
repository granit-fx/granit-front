import { useState } from 'react';

import { useCategories } from '../hooks/use-categories';

import type { CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

export interface CategoryBrowserLabels {
  readonly empty?: string;
  readonly loading?: string;
  readonly expand?: string;
  readonly collapse?: string;
}

export interface CategoryBrowserProps {
  readonly scope: string;
  readonly onSelect: (category: CategoryResponse) => void;
  readonly labels?: CategoryBrowserLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<CategoryBrowserLabels> = {
  empty: 'No categories.',
  loading: 'Loading…',
  expand: 'Expand',
  collapse: 'Collapse',
};

interface BrowserNodeProps {
  readonly scope: string;
  readonly category: CategoryResponse;
  readonly labels: Required<CategoryBrowserLabels>;
  readonly onSelect: (category: CategoryResponse) => void;
}

function BrowserNode({ scope, category, labels, onSelect }: Readonly<BrowserNodeProps>): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const childrenQuery = useCategories({ scope, parentId: category.id }, { enabled: expanded });
  const canExpand = category.hasChildren !== false;

  return (
    <li data-granit-category-browser-node="" data-granit-category-id={category.id}>
      <span data-granit-category-browser-row="">
        {canExpand && (
          <button
            type="button"
            data-granit-category-browser-toggle=""
            aria-label={expanded ? labels.collapse : labels.expand}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? '−' : '+'}
          </button>
        )}
        <button
          type="button"
          data-granit-category-browser-name=""
          onClick={() => onSelect(category)}
        >
          {category.name}
        </button>
      </span>
      {expanded && (
        <ul data-granit-category-browser-children="">
          {childrenQuery.isLoading && (
            <li data-granit-category-browser-loading="">{labels.loading}</li>
          )}
          {(childrenQuery.data ?? []).map((child) => (
            <BrowserNode
              key={child.id}
              scope={scope}
              category={child}
              labels={labels}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Headless lazy category browser — the framework-agnostic default selection
 * surface for {@link CategorySelector}. Renders nested plain `<ul>`/`<button>`
 * elements (no `@granit/react-ui` dependency); each node lazy-loads its
 * children on expand. The richer tree-styled variant lives in
 * `@granit/react-ui-taxonomy` (`CategoryTree`) and can be injected via the
 * selector's `renderTree` prop.
 */
export function CategoryBrowser({
  scope,
  onSelect,
  labels,
  className,
}: CategoryBrowserProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const rootsQuery = useCategories({ scope });

  if (rootsQuery.isLoading) {
    return (
      <div data-granit-category-browser="" data-granit-category-browser-loading="" className={className}>
        {labelStrings.loading}
      </div>
    );
  }

  const roots = rootsQuery.data ?? [];

  return (
    <div data-granit-category-browser="" data-granit-category-browser-scope={scope} className={className}>
      {roots.length === 0 ? (
        <div data-granit-category-browser-empty="">{labelStrings.empty}</div>
      ) : (
        <ul data-granit-category-browser-roots="">
          {roots.map((root) => (
            <BrowserNode
              key={root.id}
              scope={scope}
              category={root}
              labels={labelStrings}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
