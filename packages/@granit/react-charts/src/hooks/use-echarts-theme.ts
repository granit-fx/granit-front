import { buildEChartsTheme } from '@granit/charts';
import { useEffect, useMemo, useState } from 'react';

import { echarts } from '../echarts-instance.js';

import type { ChartThemeTokens } from '@granit/charts';

export interface UseEChartsThemeOptions {
  readonly lightTokens: ChartThemeTokens;
  readonly darkTokens?: ChartThemeTokens;
  /**
   * Selector or media-query strategy used to detect dark mode. Defaults to
   * `'class'` (matches the Tailwind/`dark:` convention — looks for a `.dark`
   * ancestor on the document element).
   */
  readonly darkModeStrategy?: 'class' | 'media';
  /**
   * Theme name pair used when registering. Defaults to `granit-light` /
   * `granit-dark`. Apps that compose multiple themes can override these.
   */
  readonly themeNames?: readonly [light: string, dark: string];
}

/**
 * Registers light + dark ECharts themes from Tailwind tokens and returns the
 * name of the theme currently in effect. Pass that name to a chart's `theme`
 * prop:
 *
 *   const theme = useEChartsTheme({ lightTokens, darkTokens });
 *   return <LineChart series={...} theme={theme} />;
 *
 * The hook re-runs when the dark-mode signal changes — for the `class`
 * strategy, that's a `MutationObserver` on `<html>`'s `class` attribute; for
 * the `media` strategy, a `prefers-color-scheme` media query.
 */
export function useEChartsTheme(options: UseEChartsThemeOptions): string {
  const {
    lightTokens,
    darkTokens,
    darkModeStrategy = 'class',
    themeNames = ['granit-light', 'granit-dark'],
  } = options;

  const [lightName, darkName] = themeNames;

  const lightTheme = useMemo(() => buildEChartsTheme(lightTokens), [lightTokens]);
  const darkTheme = useMemo(
    () => (darkTokens ? buildEChartsTheme(darkTokens) : null),
    [darkTokens]
  );

  // Register themes on the shared ECharts instance — `registerTheme` is
  // idempotent for the same name, so re-registration on token change is fine.
  useEffect(() => {
    echarts.registerTheme(lightName, lightTheme);
    if (darkTheme) echarts.registerTheme(darkName, darkTheme);
  }, [lightName, lightTheme, darkName, darkTheme]);

  const [isDark, setIsDark] = useState(() => detectDarkMode(darkModeStrategy));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (darkModeStrategy === 'media') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => setIsDark(mq.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    // class strategy
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [darkModeStrategy]);

  return isDark && darkTheme ? darkName : lightName;
}

function detectDarkMode(strategy: 'class' | 'media'): boolean {
  if (typeof window === 'undefined') return false;
  if (strategy === 'media') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return document.documentElement.classList.contains('dark');
}
