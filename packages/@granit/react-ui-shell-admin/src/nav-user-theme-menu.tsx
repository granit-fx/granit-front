import { useTranslation } from '@granit/react-localization';
import { useColorThemeStore } from '@granit/react-shell-core';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@granit/react-ui';
import { COLOR_THEMES, COLOR_THEME_SWATCHES } from '@granit/ui-theme';
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

// Labels use the flat default `translation` namespace with inline English
// fallbacks (the shell-admin convention — the package ships no locale bundle,
// so a consuming app provides `Theme.*` keys via its backend localization and
// the menu still reads in English everywhere else).

const MODE_OPTIONS = [
  { value: 'light', icon: Sun, labelKey: 'Theme.Light', fallback: 'Light' },
  { value: 'dark', icon: Moon, labelKey: 'Theme.Dark', fallback: 'Dark' },
  { value: 'system', icon: Monitor, labelKey: 'Theme.System', fallback: 'System' },
] as const;

/**
 * The two orthogonal theme axes in one nested menu: the light/dark/system mode
 * (next-themes, toggles the `.dark` class) and the colour theme (the
 * `ColorThemeStoreProvider` store, sets `<html data-theme>`). Swatch colours
 * come from `@granit/ui-theme` so the dots can never drift from the palettes.
 */
export function NavUserThemeMenu() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const colorTheme = useColorThemeStore((s) => s.colorTheme);
  const setColorTheme = useColorThemeStore((s) => s.setColorTheme);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger data-slot="nav-user-theme-trigger">
        <Palette className="mr-2 h-4 w-4" />
        {t('Theme.Label', 'Theme')}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="min-w-[180px]">
          <DropdownMenuLabel>{t('Theme.Mode', 'Mode')}</DropdownMenuLabel>
          {MODE_OPTIONS.map(({ value, icon: Icon, labelKey, fallback }) => (
            <DropdownMenuItem
              key={value}
              data-active={theme === value ? 'true' : undefined}
              onSelect={(e) => {
                e.preventDefault();
                setTheme(value);
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="flex-1">{t(labelKey, fallback)}</span>
              {theme === value && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t('Theme.Color', 'Color')}</DropdownMenuLabel>
          {COLOR_THEMES.map((ct) => {
            const label = ct.charAt(0).toUpperCase() + ct.slice(1);
            return (
              <DropdownMenuItem
                key={ct}
                data-active={colorTheme === ct ? 'true' : undefined}
                onSelect={(e) => {
                  e.preventDefault();
                  setColorTheme(ct);
                }}
              >
                <span
                  className="mr-2 h-3.5 w-3.5 rounded-full border border-border"
                  style={{ backgroundColor: COLOR_THEME_SWATCHES[ct] }}
                />
                <span className="flex-1">{t(`Theme.Colors.${label}`, label)}</span>
                {colorTheme === ct && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
