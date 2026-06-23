import type { EntityRelationManifest } from '@granit/entities';
import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { EntityDetailContent } from './entity-detail-content';
import { EntityPageLayout } from './entity-page-layout';

// Workspace-scoped entity detail route (`/w/:workspace/:entity/:id`).
// Wraps `<EntityDetailContent />` with the unified `<EntityPageLayout />`
// shell (back button + comfortable content width) so the placement of
// title / actions stays consistent with the list and form surfaces.
export function WorkspaceEntityDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspace, entity, id } = useParams<{
    workspace: string;
    entity: string;
    id: string;
  }>();

  if (!workspace || !entity || !id) {
    return (
      <EntityPageLayout
        title={t('Entity.MissingParam.Title', 'Missing entity parameter')}
        contentWidth="comfortable"
      >
        <div />
      </EntityPageLayout>
    );
  }

  const handleRelationClick = (relation: EntityRelationManifest) => {
    navigate(
      `/w/${encodeURIComponent(workspace)}/${encodeURIComponent(relation.targetEntityName)}?source=${encodeURIComponent(id)}`
    );
  };

  // The detail body owns its own header (entity title + subtitle +
  // manifest actions), so we only mount the back-button slot here.
  // `contentWidth='comfortable'` keeps the cards readable at large
  // viewports — list pages get `'full'` for data density.
  return (
    <EntityPageLayout
      dataSlot="workspace-entity-detail-page"
      contentWidth="comfortable"
      back={
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate(`/w/${encodeURIComponent(workspace)}/${encodeURIComponent(entity)}`)
          }
        >
          <ArrowLeft className="mr-1 size-4" />
          {t('Entity.Detail.BackToList', 'Back to list')}
        </Button>
      }
    >
      <EntityDetailContent
        entityName={entity}
        entityId={id}
        workspace={workspace}
        onRelationClick={handleRelationClick}
      />
    </EntityPageLayout>
  );
}
