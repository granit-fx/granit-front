import { usePermissions } from '@granit/react-authorization';
import { DocumentDetail, ShareDialog, VersionsTimeline } from '@granit/react-documents';
import { useTranslation } from '@granit/react-localization';
import { CategorySelector, DocumentTagChipStrip } from '@granit/react-taxonomy';
import { Button } from '@granit/react-ui';
import {
  TAXONOMY_DEFAULT_SCOPE,
  TAXONOMY_PERMISSIONS,
  TAXONOMY_TARGET_TYPES,
} from '@granit/react-ui-taxonomy';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { DOCUMENTS_PERMISSIONS } from '../constants';

export function DocumentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(DOCUMENTS_PERMISSIONS.Documents.Manage);
  const canManageShares = hasPermission(DOCUMENTS_PERMISSIONS.Shares.Manage);
  const canTransferOwnership = hasPermission(DOCUMENTS_PERMISSIONS.Documents.TransferOwnership);
  const canManageTags = hasPermission(TAXONOMY_PERMISSIONS.TAGS_MANAGE);
  const canManageCategories = hasPermission(TAXONOMY_PERMISSIONS.CATEGORIES_MANAGE);
  const [sharesOpen, setSharesOpen] = useState(false);

  if (!id) {
    return (
      <div data-slot="document-detail-page" className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {t('documents:Document.Detail.NotFound', 'Document not found.')}
        </p>
      </div>
    );
  }

  return (
    <div data-slot="document-detail-page" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {t('documents:Document.Detail.Title', 'Document')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to={`/documents/${id}/metadata`}>
              {t('documents:Document.Detail.Properties', 'Properties')}
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/documents/${id}/public-links`}>
              {t('documents:Document.Detail.PublicLinks', 'Public Links')}
            </Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/documents/${id}/renditions`}>
              {t('documents:Document.Detail.Renditions', 'Renditions')}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSharesOpen((open) => !open);
            }}
          >
            {t('documents:Document.Detail.Shares', 'Shares')}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-4">
        <DocumentTagChipStrip
          scope={TAXONOMY_DEFAULT_SCOPE}
          basePath="/api/v1"
          documentId={id}
          hideOnCardOnly={false}
          canManage={canManageTags}
          className="flex flex-wrap items-center gap-2"
          labels={{
            loading: t('taxonomy:Tag.Loading', 'Loading tags…'),
            error: t('taxonomy:Tag.Error', 'Tags unavailable.'),
            empty: t('taxonomy:Tag.Empty', 'No tags.'),
            add: t('taxonomy:Tag.Add', '+ Tag'),
            remove: t('taxonomy:Tag.Remove', 'Remove {{name}}'),
          }}
        />
        <CategorySelector
          scope={TAXONOMY_DEFAULT_SCOPE}
          targetType={TAXONOMY_TARGET_TYPES.Document}
          targetId={id}
          value={null}
          canManage={canManageCategories}
          labels={{
            noCategory: t('taxonomy:Category.NoCategory', 'No category'),
            choose: t('taxonomy:Category.Choose', 'Choose…'),
            clear: t('taxonomy:Category.Clear', 'Clear'),
            close: t('taxonomy:Category.Close', 'Close'),
            dialogTitle: t('taxonomy:Category.DialogTitle', 'Choose a category'),
          }}
        />
      </div>

      <DocumentDetail
        documentId={id}
        canManage={canManage}
        canTransferOwnership={canTransferOwnership}
        labels={{
          loading: t('documents:Document.Detail.Loading', 'Loading document…'),
          notFound: t('documents:Document.Detail.NotFound', 'Document not found.'),
          owner: t('documents:Document.Detail.Owner', 'Owner'),
          status: t('documents:Document.Detail.Status', 'Status'),
          description: t('documents:Document.Detail.Description', 'Description'),
          noDescription: t('documents:Document.Detail.NoDescription', 'No description.'),
          download: t('documents:Document.Detail.Download', 'Download current version'),
          rename: t('documents:Document.Detail.Rename', 'Rename'),
          versions: t('documents:Document.Detail.Versions', 'Versions'),
          shares: t('documents:Document.Detail.Shares', 'Shares'),
          tags: t('documents:Document.Detail.Tags', 'Tags'),
          transferOwnership: t('documents:TransferOwnership.DocumentTrigger', 'Transfer ownership'),
        }}
      />

      <VersionsTimeline
        documentId={id}
        labels={{
          title: t('documents:Versions.Title', 'Version history'),
          empty: t('documents:Versions.Empty', 'No versions yet.'),
          loading: t('documents:Versions.Loading', 'Loading versions…'),
          versionHeader: t('documents:Versions.VersionHeader', 'Version'),
          authorHeader: t('documents:Versions.AuthorHeader', 'Author'),
          dateHeader: t('documents:Versions.DateHeader', 'Date'),
          sizeHeader: t('documents:Versions.SizeHeader', 'Size'),
          messageHeader: t('documents:Versions.MessageHeader', 'Message'),
          download: t('documents:Versions.Download', 'Download'),
          current: t('documents:Versions.Current', 'current'),
          previous: t('documents:Versions.Previous', 'Previous'),
          next: t('documents:Versions.Next', 'Next'),
        }}
      />

      {sharesOpen && (
        <ShareDialog
          target={{ type: 'Document', id }}
          canManage={canManageShares}
          labels={{
            dialogTitle: t('documents:Shares.DialogTitle', 'Shares'),
            granteeTypeHeader: t('documents:Shares.GranteeTypeHeader', 'Type'),
            granteeHeader: t('documents:Shares.GranteeHeader', 'Grantee'),
            permissionHeader: t('documents:Shares.PermissionHeader', 'Permission'),
            expiresAtHeader: t('documents:Shares.ExpiresAtHeader', 'Expires'),
            revoke: t('documents:Shares.Revoke', 'Revoke'),
            empty: t('documents:Shares.Empty', 'No shares yet.'),
            addShare: t('documents:Shares.AddShare', 'Add share'),
            granteeTypeUser: t('documents:Shares.GranteeTypeUser', 'User'),
            granteeTypeRole: t('documents:Shares.GranteeTypeRole', 'Role'),
            granteeTypeGroup: t('documents:Shares.GranteeTypeGroup', 'Group'),
            permissionRead: t('documents:Shares.PermissionRead', 'Read'),
            permissionEdit: t('documents:Shares.PermissionEdit', 'Edit'),
            permissionManage: t('documents:Shares.PermissionManage', 'Manage'),
            isDefault: t('documents:Shares.IsDefault', 'Inherit to children'),
            grant: t('documents:Shares.Grant', 'Grant'),
            cancel: t('documents:Shares.Cancel', 'Cancel'),
            loading: t('documents:Shares.Loading', 'Loading shares…'),
          }}
        />
      )}
    </div>
  );
}
