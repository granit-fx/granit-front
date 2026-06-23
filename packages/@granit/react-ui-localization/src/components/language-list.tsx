import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import { useLanguages } from '../languages-context';

/**
 * Read-only list of the languages available in the application.
 *
 * Languages are sourced from `LanguagesContext`, populated from
 * `GET /localization` (`ApplicationLocalizationResponse.languages`). The
 * backend exposes no language enable/disable capability, so this view is
 * intentionally read-only.
 */
export function LanguageList() {
  const { t } = useTranslation();
  const languages = useLanguages();

  if (languages.length === 0) return null;

  const sorted = [...languages].sort((a, b) => a.cultureName.localeCompare(b.cultureName));

  return (
    <div data-slot="language-list" className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">{t('Localization.Languages.Title')}</h3>
      <div className="rounded-lg border">
        {sorted.map((lang, index) => (
          <div
            key={lang.cultureName}
            data-slot="language-row"
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              index < sorted.length - 1 && 'border-b'
            )}
          >
            <span className="text-lg">{lang.flagIcon ?? '🌐'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{lang.displayName}</span>
                <span className="text-xs text-muted-foreground">{lang.cultureName}</span>
                {lang.isDefault && (
                  <Badge variant="secondary" className="text-[10px]">
                    {t('Localization.Languages.Default')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
