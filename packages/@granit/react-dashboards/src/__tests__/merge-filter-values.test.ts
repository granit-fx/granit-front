import { describe, expect, it } from 'vitest';

import { mergeFilterValuesIntoRequest } from '../lib/merge-filter-values.js';

import type { DashboardRenderRequest } from '@granit/dashboards';

describe('mergeFilterValuesIntoRequest', () => {
  it('returns the input request verbatim when there are no filter values', () => {
    const request: DashboardRenderRequest = { periodToken: 'mtd' };
    expect(mergeFilterValuesIntoRequest(request, undefined)).toBe(request);
    expect(mergeFilterValuesIntoRequest(request, null)).toBe(request);
    expect(mergeFilterValuesIntoRequest(request, {})).toBe(request);
  });

  it('folds non-null values into request.filters', () => {
    const request: DashboardRenderRequest = { periodToken: 'mtd' };
    const merged = mergeFilterValuesIntoRequest(request, {
      Customer: '42',
      Status: 'Open',
    });
    expect(merged.filters).toEqual({ Customer: '42', Status: 'Open' });
    expect(merged.periodToken).toBe('mtd');
  });

  it('drops null entries (clears the filter rather than sending an empty string)', () => {
    const request: DashboardRenderRequest = {
      filters: { Customer: '42', Status: 'Open' },
    };
    const merged = mergeFilterValuesIntoRequest(request, { Status: null });
    expect(merged.filters).toEqual({ Customer: '42' });
  });

  it('lets live values override pre-populated request.filters on the same key', () => {
    const request: DashboardRenderRequest = {
      filters: { Customer: 'old' },
    };
    const merged = mergeFilterValuesIntoRequest(request, { Customer: 'new' });
    expect(merged.filters).toEqual({ Customer: 'new' });
  });

  it('returns the request without filters when every effective key is null', () => {
    const request: DashboardRenderRequest = {};
    const merged = mergeFilterValuesIntoRequest(request, { A: null, B: null });
    expect(merged.filters).toBeUndefined();
  });
});
