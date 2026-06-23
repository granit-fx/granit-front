import { useLocale } from '@granit/react-localization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@granit/react-ui';
import { Globe } from 'lucide-react';

import { useLanguages } from '../languages-context';

export function LanguageSwitcher() {
  const languages = useLanguages();
  const { locale, setLocale } = useLocale();

  if (languages.length === 0) return null;

  return (
    <div data-slot="language-switcher" className="mt-6 flex justify-center">
      <Select value={locale} onValueChange={setLocale}>
        <SelectTrigger className="h-8 w-auto gap-2 border-none bg-transparent text-xs text-muted-foreground shadow-none">
          <Globe className="size-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="min-w-36">
          {languages.map((lang) => (
            <SelectItem key={lang.cultureName} value={lang.cultureName}>
              {lang.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
