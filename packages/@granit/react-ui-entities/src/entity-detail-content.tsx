import { useGranitClient } from '@granit/react-api-client';
import {
  EntityDetail,
  useEntityDiscovery,
  useEntityMetadata,
  type EntityActionHandlers,
} from '@granit/react-entities';
import { resolveLabel, useDateFormatter, useTranslation } from '@granit/react-localization';
import { Skeleton } from '@granit/react-ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { CollectionSectionCard } from './collection-section-card';
import { EntityActionButton } from './entity-action-button';
import { asExtended } from './manifest-extensions';

import type { EntityRelationManifest } from '@granit/entities';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

type DateFormatter = (date: string | Date) => string;

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value); // NOSONAR: remaining types (symbol, function) stringify safely
}

function formatValuesForDetail(
  values: Readonly<Record<string, unknown>>,
  propertyComponents: Readonly<Record<string, string>>,
  locale: string,
  formatDate: DateFormatter,
  formatDateTime: DateFormatter
): Record<string, unknown> {
  const currencyCode = (values.Currency as string | undefined) ?? 'EUR';
  const moneyFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode });

  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      const component = propertyComponents[key];
      if (component === 'money' && typeof value === 'number') {
        return [key, moneyFmt.format(value / 100)];
      }
      // Timezone-aware (user PreferredTimezone) via useDateFormatter, not raw Intl.
      if ((component === 'date' || component === 'datetime') && typeof value === 'string') {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return [key, component === 'datetime' ? formatDateTime(value) : formatDate(value)];
        }
      }
      if (!component && typeof value === 'string' && ISO_DATE_RE.test(value)) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return [key, formatDate(value)];
      }
      return [key, value];
    })
  );
}

function toPascalCaseKeys(obj: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.charAt(0).toUpperCase() + key.slice(1), value])
  );
}

export interface EntityDetailContentProps {
  /** Entity wire identifier — e.g. `Granit.Parties.Party`. */
  readonly entityName: string;
  /** Entity row id. */
  readonly entityId: string;
  /**
   * Optional workspace name used for relation drilldown URLs. When
   * omitted (e.g. side-peek mode without an active workspace), relation
   * clicks are no-ops.
   */
  readonly workspace?: string | null;
  /** Optional callback when a relation is clicked — overrides default nav. */
  readonly onRelationClick?: (relation: EntityRelationManifest) => void;
}

// Manifest-driven entity detail body — header + `<EntityDetail />`
// (sections, side panels, smart-button relations) + collection sections.
// Reused by `<WorkspaceEntityDetailPage>` (full page) and
// `<SidePeekDrawer>` (Notion-style overlay) so the rendering logic stays
// in a single place and any new manifest extension shows up everywhere.
export function EntityDetailContent({
  entityName,
  entityId,
  workspace,
  onRelationClick: onRelationClickProp,
}: EntityDetailContentProps) {
  const { t, i18n } = useTranslation();
  const { formatDate, formatDateTime } = useDateFormatter();
  const client = useGranitClient();
  const navigate = useNavigate();
  const { data: manifestRaw, isLoading: isManifestLoading } = useEntityMetadata(entityName);
  const { data: discovery } = useEntityDiscovery();
  const manifest = manifestRaw ? asExtended(manifestRaw) : undefined;

  // Override the framework's default `Navigate` handler so urlTemplate-
  // based actions stay in-app (React Router push) rather than triggering
  // a full page load via `globalThis.location.href`.
  const actionHandlers = useMemo<EntityActionHandlers>(
    () => ({
      navigate: (action, rowId) => {
        if (!action.urlTemplate) return;
        const url = rowId
          ? action.urlTemplate.replaceAll('{id}', encodeURIComponent(rowId))
          : action.urlTemplate;
        navigate(url);
      },
    }),
    [navigate]
  );

  const basePath = discovery
    ? (discovery.modules.flatMap((m) => m.items).find((it) => it.name === entityName)?.links.list ??
      null)
    : null;

  const {
    data: entityData,
    isLoading: isEntityLoading,
    isError: isEntityError,
  } = useQuery<Readonly<Record<string, unknown>>>({
    queryKey: ['entity', entityName, entityId],
    queryFn: async () => {
      if (!basePath) throw new Error('Missing base path');
      const response = await client.get<Readonly<Record<string, unknown>>>(
        `${basePath}/${encodeURIComponent(entityId)}`
      );
      return response.data;
    },
    enabled: Boolean(basePath),
  });

  if (isManifestLoading || isEntityLoading || !discovery) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!manifest || !entityData || isEntityError) {
    return (
      <div data-slot="entity-detail-content-error" className="space-y-2">
        <h2 className="text-2xl font-semibold">
          {t('Entity.Detail.NotFound.Title', 'Record not found')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Entity.Detail.NotFound.Body',
            'No record matched the requested id, or the manifest could not be resolved.'
          )}
        </p>
      </div>
    );
  }

  const detailVariant = manifest.details?.[0];
  if (!detailVariant) {
    return (
      <div data-slot="entity-detail-content-no-variant" className="space-y-2">
        <h2 className="text-2xl font-semibold">
          {t('Entity.Detail.NoVariant.Title', 'No detail variant')}
        </h2>
      </div>
    );
  }

  const fallbackTitle = resolveLabel(
    manifest.identity?.displayKey ?? null,
    manifest.identity?.name ?? entityName
  );

  const rawValues = toPascalCaseKeys(entityData);
  const headerLabel = manifest.identity?.displayProperty
    ? rawValues[manifest.identity.displayProperty]
    : null;
  const subtitleValue = manifest.identity?.subtitleProperty
    ? rawValues[manifest.identity.subtitleProperty]
    : null;
  const subtitle = subtitleValue == null ? fallbackTitle : toDisplayString(subtitleValue);

  // Detail sections declared with explicit `fields: [...]` lose the
  // `field.component` linkage that inherited mode provides automatically.
  // Re-derive the property → component map from the form variants so
  // `<EntityDetail />` knows to render Website as a `url` anchor,
  // Email as `mailto`, etc., via the detail widget catalog the bridge
  // registers (granit-front PR #331). For inherited sections the
  // framework still reads `field.component` directly — passing this
  // map alongside is harmless. Same map drives the legacy currency /
  // date pre-formatter below until those widgets ship in the catalog.
  const propertyComponents = (() => {
    const map: Record<string, string> = {};
    for (const form of manifest.forms ?? []) {
      for (const section of form.sections) {
        for (const field of section.fields) {
          if (field.component) map[field.propertyName] = field.component;
        }
      }
    }
    return map;
  })();

  const values = formatValuesForDetail(
    rawValues,
    propertyComponents,
    i18n.language,
    formatDate,
    formatDateTime
  );

  const sortedActions = [...(manifest.actions ?? [])].sort((a, b) => a.order - b.order);
  const sortedCollectionSections = [...(manifest.collectionSections ?? [])].sort(
    (a, b) => a.order - b.order
  );

  const handleRelationClick = onRelationClickProp;

  return (
    <div data-slot="entity-detail-content" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {headerLabel != null && (
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {toDisplayString(headerLabel)}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {sortedActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {sortedActions.map((action) => (
              <EntityActionButton
                key={action.name}
                action={action}
                entityId={entityId}
                actionHandlers={actionHandlers}
              />
            ))}
          </div>
        )}
      </header>

      <EntityDetail
        variant={detailVariant}
        values={values}
        formVariants={manifest.forms ?? undefined}
        propertyComponents={propertyComponents}
        entityName={manifest.identity?.name ?? entityName}
        entityId={entityId}
        relations={manifest.relations ?? undefined}
        onRelationClick={handleRelationClick}
      />

      {sortedCollectionSections.map((section) => (
        <CollectionSectionCard
          key={section.key}
          section={section}
          values={entityData}
          locale={i18n.language}
        />
      ))}

      {/* `workspace` reserved for future workspace-aware relation nav once
          the framework grows preset overlay composition. Reading it here
          satisfies the linter without conditionally rendering on it. */}
      <span data-workspace-context={workspace ?? ''} hidden />
    </div>
  );
}
