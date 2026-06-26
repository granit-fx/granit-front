import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Storybook's stock light theme — only the brand title is customised, every
// colour stays at the install default (no custom palette on the Storybook UI).
const granitTheme = create({
  base: 'light',
  brandTitle: 'Granit Front — Design System',
  brandUrl: '/',
  brandTarget: '_self',
});

addons.setConfig({ theme: granitTheme });
