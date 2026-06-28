import { describe, expect, it } from 'vitest';

import { resolveWidgetTitle } from '../resolve-widget-title';

import type { TFunction } from 'i18next';

const bundle: Record<string, string> = { 'Widget:Dash.RevenueChart.Title': 'Revenue' };

// Minimal i18next stub: returns the bundle entry, else the supplied defaultValue.
const t = ((key: string, opts: { defaultValue: string }) =>
  bundle[key] ?? opts.defaultValue) as unknown as TFunction;

describe('resolveWidgetTitle', () => {
  it('returns the translation for a known key', () => {
    expect(resolveWidgetTitle(t, 'Widget:Dash.RevenueChart.Title')).toBe('Revenue');
  });

  it('shows a free-text title verbatim when it is not a known key', () => {
    expect(resolveWidgetTitle(t, 'Cancellations over time')).toBe('Cancellations over time');
  });

  it('collapses an unresolved Namespace:… key to empty (no header)', () => {
    expect(resolveWidgetTitle(t, 'Widget:Dash.chart-1.Title')).toBe('');
  });

  it('returns empty for an absent title', () => {
    expect(resolveWidgetTitle(t, undefined)).toBe('');
    expect(resolveWidgetTitle(t, '')).toBe('');
  });
});
