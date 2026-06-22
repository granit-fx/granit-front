import { useGranitClient } from '@granit/react-api-client';
import { FeaturesProvider, useFeatureDefinitions, useFeatureValues } from '@granit/react-features';
import { useTranslation } from '@granit/react-localization';
import { Spinner } from '@granit/react-ui';

import { FeatureGroupCard } from './components/feature-group-card';

export function FeatureListPage() {
  // The Axios client is resolved from the GranitClientProvider in the host tree
  // and handed to the headless data provider — no `@/lib/api` coupling.
  const client = useGranitClient();
  return (
    <FeaturesProvider config={{ client }}>
      <FeatureListPageContent />
    </FeaturesProvider>
  );
}

function FeatureListPageContent() {
  const { t } = useTranslation();
  const { data: groups, isLoading } = useFeatureDefinitions();
  const { data: values } = useFeatureValues();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="feature-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Features.List.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Features.List.Description')}</p>
      </div>

      {groups && groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <FeatureGroupCard key={group.name} group={group} values={values} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('Features.List.Empty')}</p>
      )}
    </div>
  );
}
