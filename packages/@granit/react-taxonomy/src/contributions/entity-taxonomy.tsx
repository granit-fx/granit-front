import { CategorySelector } from '../components/category-selector.tsx';
import { TagChipStrip } from '../components/tag-chip-strip.tsx';

import type { CategorySelectorLabels } from '../components/category-selector.tsx';
import type { TagChipStripLabels } from '../components/tag-chip-strip.tsx';
import type { ReactNode } from 'react';

export interface EntityTaxonomyContributionOptions {
  /** Module scope, e.g. `'documents'` / `'parties'`. Required. */
  readonly scope: string;
  /** Show the chip strip. Default `true`. */
  readonly showTags?: boolean;
  /** Show the category selector. Default `true`. */
  readonly showCategory?: boolean;
  /** Default `false` on the entity-detail surface. */
  readonly hideOnCardOnly?: boolean;
  readonly canManage?: boolean;
  readonly tagLabels?: TagChipStripLabels;
  readonly categoryLabels?: CategorySelectorLabels;
  readonly className?: string;
}

export interface EntityTaxonomyProps {
  /** Wire identifier of the entity (e.g. `"Granit.Documents.Domain.Document"`). */
  readonly entityName: string;
  readonly entityId: string;
  /** Currently assigned category id, supplied by the host (read from the entity payload). */
  readonly categoryId?: string | null;
}

/**
 * Factory producing an `EntityTaxonomy` renderer that hosts can place on
 * the entity-detail surface — header, side rail, drawer, wherever. We
 * deliberately do NOT key into `EntitySidePanel` for this contribution
 * because `SidePanelKind` in `@granit/entities` is a closed union; adding
 * `'Taxonomy'` is a separate breaking change for that package. Until
 * then, hosts call this factory at module wiring time and render the
 * returned component themselves.
 *
 * ```tsx
 * import { entityTaxonomy } from '@granit/react-taxonomy';
 * const EntityTaxonomy = entityTaxonomy({ scope: 'documents', canManage: true });
 *
 * function DocumentDetail({ doc }: { doc: Document }) {
 *   return <EntityTaxonomy entityName="Granit.Documents.Domain.Document" entityId={doc.id} categoryId={doc.categoryId} />;
 * }
 * ```
 */
export function entityTaxonomy(
  options: EntityTaxonomyContributionOptions
): (props: EntityTaxonomyProps) => ReactNode {
  const {
    scope,
    showTags = true,
    showCategory = true,
    hideOnCardOnly = false,
    canManage = false,
    tagLabels,
    categoryLabels,
    className,
  } = options;

  if (!showTags && !showCategory) {
    return function EmptyEntityTaxonomy(): ReactNode {
      return null;
    };
  }

  return function EntityTaxonomy({
    entityName,
    entityId,
    categoryId,
  }: EntityTaxonomyProps): ReactNode {
    return (
      <div
        data-granit-entity-taxonomy=""
        data-granit-entity-taxonomy-scope={scope}
        className={className}
      >
        {showTags && (
          <TagChipStrip
            scope={scope}
            targetType={entityName}
            targetId={entityId}
            hideOnCardOnly={hideOnCardOnly}
            canManage={canManage}
            labels={tagLabels}
          />
        )}
        {showCategory && (
          <CategorySelector
            scope={scope}
            targetType={entityName}
            targetId={entityId}
            value={categoryId ?? null}
            canManage={canManage}
            labels={categoryLabels}
          />
        )}
      </div>
    );
  };
}
