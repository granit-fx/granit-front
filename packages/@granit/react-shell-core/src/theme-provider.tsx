import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode } from 'react';

export interface ThemeProviderProps {
  readonly children: ReactNode;
  /** next-themes default mode. Defaults to 'system'. */
  readonly defaultTheme?: string;
}

/**
 * Dark/light/system theme provider (next-themes, `class` attribute). Orthogonal
 * to the colour theme: dark mode toggles the `.dark` class while the colour
 * theme sets `<html data-theme>` (see `ColorThemeStoreProvider`). The
 * @granit/ui-theme `.dark[data-theme=…]` palettes depend on BOTH being present.
 */
export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
