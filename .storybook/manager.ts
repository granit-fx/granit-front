import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

const granitTheme = create({
  base: 'dark',
  brandTitle: 'Granit Front — Design System',
  brandUrl: '/',
  brandTarget: '_self',

  colorPrimary: '#6366f1',
  colorSecondary: '#4f46e5',

  appBg: '#0f172a',
  appContentBg: '#1e293b',
  appBorderColor: '#334155',
  appBorderRadius: 8,

  textColor: '#f8fafc',
  textMutedColor: '#94a3b8',
  textInverseColor: '#0f172a',

  barTextColor: '#94a3b8',
  barSelectedColor: '#818cf8',
  barHoverColor: '#a5b4fc',
  barBg: '#1e293b',

  inputBg: '#334155',
  inputBorder: '#475569',
  inputTextColor: '#f8fafc',
  inputBorderRadius: 6,
});

addons.setConfig({ theme: granitTheme });
