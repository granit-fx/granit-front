import { useTranslation } from '@granit/react-localization';

import { AppSettingsPanel } from './components/app-settings-panel';

import type { AdminSettingsScope } from '@granit/settings';

export interface AppSettingsEditPageProps {
  /** Settings scope — host apps pass `'global'`, tenant apps `'tenant'`. Defaults to `'global'`. */
  readonly scope?: AdminSettingsScope;
}

export function AppSettingsEditPage({ scope = 'global' }: AppSettingsEditPageProps = {}) {
  const { t } = useTranslation();

  return (
    <div data-slot="app-settings-edit-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Config.AppSettings.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Config.AppSettings.Subtitle')}</p>
      </div>

      <AppSettingsPanel scope={scope} />
    </div>
  );
}
