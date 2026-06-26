import { TooltipProvider } from '@granit/react-ui';
import { COLOR_THEME_CATALOG, DEFAULT_COLOR_THEME } from '@granit/ui-theme';
import { UI_THEMES_CATALOG } from '@granit/ui-themes';
import { withThemeByClassName } from '@storybook/addon-themes';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { createElement, useEffect } from 'react';

import type { Preview } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import './storybook.css';
import './i18n';

// Single MSW worker; stories supply their own handlers via `parameters.msw`.
initialize({ onUnhandledRequest: 'bypass', quiet: true });

const PALETTE_GLOBAL = 'palette';

// Storybook is the framework's shop window: show the WHOLE catalogue — the base
// accent themes (@granit/ui-theme) plus the opt-in full themes (@granit/ui-themes).
// A real app would offer only its chosen subset.
const FULL_CATALOGUE = [...COLOR_THEME_CATALOG, ...UI_THEMES_CATALOG];

// Applies the selected colour palette to <html> via `data-theme` — the exact
// runtime contract of the app's colour-theme store. Mirrors what
// `withThemeByClassName` does for the `.dark` class (also on <html>), so the
// compound `.dark[data-theme='…']` selectors resolve correctly.
function PaletteRoot({ palette, children }: { palette: string; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = palette;
  }, [palette]);
  return children;
}

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      source: { state: 'open' as const },
    },
    a11y: {
      test: 'todo',
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Introduction', 'Foundations', 'UI', 'Admin Kit', 'Shell', '*'],
      },
    },
  },
  // Colour-palette toolbar, sibling to the addon-themes Light/Dark switcher.
  // Driven by @granit/ui-theme so the toolbar and the CSS palettes never drift.
  globalTypes: {
    [PALETTE_GLOBAL]: {
      description: 'Colour palette',
      toolbar: {
        title: 'Palette',
        icon: 'paintbrush',
        items: FULL_CATALOGUE.map(({ id, label }) => ({ value: id, title: label })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    [PALETTE_GLOBAL]: DEFAULT_COLOR_THEME,
  },
  loaders: [mswLoader],
  decorators: [
    // Mirror an app root's global TooltipProvider so tooltip-using components
    // render in isolation without each story wrapping its own.
    (Story) => createElement(TooltipProvider, null, createElement(Story)),
    (Story, context) =>
      createElement(
        PaletteRoot,
        { palette: (context.globals[PALETTE_GLOBAL] as string) ?? DEFAULT_COLOR_THEME },
        createElement(Story)
      ),
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
