import type { CategoryDetailResponse, CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

export interface CategoryBreadcrumbProps {
  readonly category: CategoryDetailResponse;
  /** Click handler for individual breadcrumb segments (e.g. for filtering). */
  readonly onSelect?: (category: CategoryResponse) => void;
  readonly separator?: ReactNode;
  readonly className?: string;
}

/**
 * Read-only chevron-separated path of a {@link CategoryDetailResponse}'s
 * `breadcrumb` array (root → leaf). Headless — apps style via
 * `className` and `data-granit-category-breadcrumb*` attributes.
 */
export function CategoryBreadcrumb({
  category,
  onSelect,
  separator = '›',
  className,
}: CategoryBreadcrumbProps): ReactNode {
  const segments = category.breadcrumb;
  return (
    <nav
      data-granit-category-breadcrumb=""
      data-granit-category-breadcrumb-scope={category.scope}
      aria-label="Breadcrumb"
      className={className}
    >
      <ol>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={segment.id} data-granit-category-breadcrumb-segment="">
              {onSelect && !isLast ? (
                <button type="button" onClick={() => onSelect(segment)}>
                  {segment.name}
                </button>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{segment.name}</span>
              )}
              {!isLast && (
                <span data-granit-category-breadcrumb-separator="" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
