import { TooltipProvider } from '@granit/react-ui';
import { withThemeByClassName } from '@storybook/addon-themes';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { createElement } from 'react';

import type { Preview } from '@storybook/react-vite';

import './storybook.css';
import './i18n';

// Single MSW worker; stories supply their own handlers via `parameters.msw`.
initialize({ onUnhandledRequest: 'bypass', quiet: true });

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
  loaders: [mswLoader],
  decorators: [
    // Mirror an app root's global TooltipProvider so tooltip-using components
    // render in isolation without each story wrapping its own.
    (Story) => createElement(TooltipProvider, null, createElement(Story)),
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
