import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import { CategoryTree } from '@granit/react-taxonomy';

import { TAXONOMY_DEFAULT_SCOPE, TAXONOMY_PERMISSIONS } from './constants';

export function CategoryTreePage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(TAXONOMY_PERMISSIONS.CATEGORIES_MANAGE);

  return (
    <div data-slot="category-tree-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('taxonomy:Category.Tree.Title', 'Categories')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'taxonomy:Category.Tree.Subtitle',
            'Categories are single-assignment, hierarchical buckets. Each entity belongs to at most one category in a given scope.'
          )}
        </p>
      </header>

      <CategoryTree
        scope={TAXONOMY_DEFAULT_SCOPE}
        canManage={canManage}
        labels={{
          add: t('taxonomy:Category.Tree.Add', 'Add child'),
          rename: t('taxonomy:Category.Tree.Rename', 'Rename'),
          move: t('taxonomy:Category.Tree.Move', 'Move'),
          delete: t('taxonomy:Category.Tree.Delete', 'Delete'),
          deleteConfirm: t(
            'taxonomy:Category.Tree.DeleteConfirm',
            'Delete this category? This cannot be undone. Categories with descendants or active assignments cannot be deleted.'
          ),
          moveDialogTitle: t('taxonomy:Category.Tree.MoveDialogTitle', 'Move category'),
          movePromote: t('taxonomy:Category.Tree.MovePromote', '(promote to root)'),
          movePrompt: t(
            'taxonomy:Category.Tree.MovePrompt',
            'Paste the new parent category id, or leave empty to promote to root.'
          ),
          empty: t('taxonomy:Category.Tree.Empty', 'No categories.'),
          loading: t('taxonomy:Category.Tree.Loading', 'Loading…'),
          error422HasDescendants: t(
            'taxonomy:Category.Tree.Error.HasDescendants',
            'Cannot delete: this category has descendants.'
          ),
          error422HasAssignments: t(
            'taxonomy:Category.Tree.Error.HasAssignments',
            'Cannot delete: this category has active assignments.'
          ),
          error422CrossScope: t(
            'taxonomy:Category.Tree.Error.CrossScope',
            'Cannot move across scopes.'
          ),
          error422Cycle: t(
            'taxonomy:Category.Tree.Error.Cycle',
            'Cannot move a category under one of its descendants.'
          ),
        }}
      />
    </div>
  );
}
