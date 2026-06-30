import { usePermissions } from '@granit/react-authorization';
import { useTranslation } from '@granit/react-localization';
import { usePartyQuery } from '@granit/react-parties';
import { CategorySelector, TagChipStrip } from '@granit/react-taxonomy';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@granit/react-ui';
import { TAXONOMY_PERMISSIONS, TAXONOMY_TARGET_TYPES } from '@granit/react-ui-taxonomy';
import { toEntityId } from '@granit/types';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { AddressesTab } from './addresses-tab';
import { DownloadVCardButton } from './download-vcard-button';
import { EmailsTab } from './emails-tab';
import { ExternalMappingsTab } from './external-mappings-tab';
import { LifecycleActions } from './lifecycle-actions';
import { MergeAction } from './merge-action';
import { MetadataTab } from './metadata-tab';
import { PartyDuplicatesBadge } from './party-duplicates-badge';
import { PartyIdentityForm } from './party-identity-form';
import { PartyRolesBadges } from './party-roles-badges';
import { PartyStatusBadge } from './party-status-badge';
import { PhonesTab } from './phones-tab';
import { RolesTab } from './roles-tab';
import { TaxStatusCard } from './tax-status-card';

import type { PartyId } from '@granit/parties';

export function PartyDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const partyId = id ? (toEntityId<'Party'>(id) as PartyId) : null;
  const { data: party, isLoading } = usePartyQuery(partyId);

  const { hasPermission } = usePermissions();
  const canManageTaxonomy = hasPermission(TAXONOMY_PERMISSIONS.TAGS_MANAGE);
  const canManageCategories = hasPermission(TAXONOMY_PERMISSIONS.CATEGORIES_MANAGE);
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!party) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('Parties.Detail.NotFound')}</h2>
        <p className="text-muted-foreground">{t('Parties.Detail.NotFoundMessage')}</p>
        <Button variant="outline" onClick={() => navigate('/parties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Parties.Detail.BackToList')}
        </Button>
      </div>
    );
  }

  return (
    <div data-slot="party-detail-page" className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/parties')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t('Parties.Detail.BackToList')}
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{party.name}</h2>
            <PartyStatusBadge status={party.status} />
            <span className="text-sm text-muted-foreground">{t(`Parties.Kind.${party.kind}`)}</span>
            <PartyDuplicatesBadge partyId={party.id} href="/parties/duplicates" />
          </div>
          <PartyRolesBadges roles={party.roles} />
          <TagChipStrip
            scope="parties"
            targetType={TAXONOMY_TARGET_TYPES.Party}
            targetId={party.id}
            canManage={canManageTaxonomy}
            className="flex flex-wrap items-center gap-2"
          />
          <CategorySelector
            scope="parties"
            targetType={TAXONOMY_TARGET_TYPES.Party}
            targetId={party.id}
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
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <DownloadVCardButton partyId={party.id} partyName={party.name} />
            {party.status !== 'Archived' && (
              <MergeAction survivorId={party.id} survivorName={party.name} />
            )}
          </div>
          <LifecycleActions partyId={party.id} status={party.status} />
        </div>
      </div>

      <Tabs defaultValue="identity" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="identity">{t('Parties.Tabs.Identity')}</TabsTrigger>
          <TabsTrigger value="addresses">{t('Parties.Tabs.Addresses')}</TabsTrigger>
          <TabsTrigger value="emails">{t('Parties.Tabs.Emails')}</TabsTrigger>
          <TabsTrigger value="phones">{t('Parties.Tabs.Phones')}</TabsTrigger>
          <TabsTrigger value="external-mappings">{t('Parties.Tabs.ExternalMappings')}</TabsTrigger>
          <TabsTrigger value="roles">{t('Parties.Tabs.Roles')}</TabsTrigger>
          <TabsTrigger value="metadata">{t('Parties.Tabs.Metadata')}</TabsTrigger>
          <TabsTrigger value="tax-status">{t('Parties.Tabs.TaxStatus')}</TabsTrigger>
        </TabsList>

        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>{t('Parties.Identity.Title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <PartyIdentityForm party={party} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <AddressesTab partyId={party.id} addresses={party.addresses} />
        </TabsContent>

        <TabsContent value="emails">
          <EmailsTab partyId={party.id} emails={party.emails} />
        </TabsContent>

        <TabsContent value="phones">
          <PhonesTab partyId={party.id} phones={party.phones} />
        </TabsContent>

        <TabsContent value="external-mappings">
          <ExternalMappingsTab partyId={party.id} mappings={party.externalMappings} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab partyId={party.id} roles={party.roles} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataTab partyId={party.id} metadata={party.metadata} />
        </TabsContent>

        <TabsContent value="tax-status">
          <TaxStatusCard partyId={party.id} taxStatus={party.taxStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
