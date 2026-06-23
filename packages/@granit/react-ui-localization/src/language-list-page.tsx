import { useTranslation } from '@granit/react-localization';

import { LanguageList } from './components/language-list';

export function LanguageListPage() {
  const { t } = useTranslation();

  return (
    <div data-slot="language-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Localization.Languages.Title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Localization.Languages.Subtitle')}</p>
      </div>
      <LanguageList />
    </div>
  );
}
