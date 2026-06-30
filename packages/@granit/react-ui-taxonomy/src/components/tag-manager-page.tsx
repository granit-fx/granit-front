import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';

import { TAXONOMY_DEFAULT_SCOPE, TAXONOMY_PERMISSIONS } from '../constants';

import { TagManager } from './tag-manager';

export function TagManagerPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(TAXONOMY_PERMISSIONS.TAGS_MANAGE);

  return (
    <div data-slot="tag-manager-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('taxonomy:Tag.Manager.Title', 'Tags')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'taxonomy:Tag.Manager.Subtitle',
            'Tags are reusable, many-to-many labels scoped to a single module.'
          )}
        </p>
      </header>

      <TagManager
        scope={TAXONOMY_DEFAULT_SCOPE}
        canManage={canManage}
        labels={{
          title: t('taxonomy:Tag.Manager.Title', 'Tags'),
          newTag: t('taxonomy:Tag.Manager.NewTag', 'New tag'),
          nameHeader: t('taxonomy:Tag.Manager.NameHeader', 'Name'),
          colorHeader: t('taxonomy:Tag.Manager.ColorHeader', 'Color'),
          hideHeader: t('taxonomy:Tag.Manager.HideHeader', 'Hidden on cards'),
          actionsHeader: t('taxonomy:Tag.Manager.ActionsHeader', 'Actions'),
          hideTooltip: t(
            'taxonomy:Tag.Manager.HideTooltip',
            'Hide this tag from entity cards while keeping it in admin views.'
          ),
          delete: t('taxonomy:Tag.Manager.Delete', 'Delete'),
          deleteConfirm: t(
            'taxonomy:Tag.Manager.DeleteConfirm',
            'Delete this tag? All assignments will be removed.'
          ),
          invalidColor: t(
            'taxonomy:Tag.Manager.InvalidColor',
            'Color must be a 7-character hex (e.g. #1A2B3C).'
          ),
          nameRequired: t('taxonomy:Tag.Manager.NameRequired', 'Name is required.'),
          nameTooLong: t('taxonomy:Tag.Manager.NameTooLong', 'Name must be at most 50 characters.'),
          nameConflict: t(
            'taxonomy:Tag.Manager.NameConflict',
            'A tag with this name already exists.'
          ),
          empty: t('taxonomy:Tag.Manager.Empty', 'No tags yet — create the first one.'),
          readonlyHint: t(
            'taxonomy:Tag.Manager.ReadonlyHint',
            "You don't have permission to manage tags."
          ),
          create: t('taxonomy:Tag.Manager.Create', 'Create'),
          cancel: t('taxonomy:Tag.Manager.Cancel', 'Cancel'),
        }}
      />
    </div>
  );
}
