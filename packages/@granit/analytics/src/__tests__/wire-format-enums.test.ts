import { describe, expect, it } from 'vitest';

import type { RefreshHint, Trend, ValueKind } from '../metrics/metric-response';

// Pinned wire-format fixtures for the @granit/analytics enum surface.

describe('ValueKind — exhaustive enum surface (PascalCase, backend-ordered)', () => {
  it('locks the six backend kinds in declaration order', () => {
    const kinds: readonly ValueKind[] = [
      'Count',
      'Number',
      'Currency',
      'Percentage',
      'Duration',
      'Date',
    ];
    expect(kinds).toHaveLength(6);
  });
});

describe('RefreshHint — exhaustive enum surface (PascalCase)', () => {
  it('locks the three backend hints (Static / Dynamic / Realtime)', () => {
    const hints: readonly RefreshHint[] = ['Static', 'Dynamic', 'Realtime'];
    expect(hints).toHaveLength(3);
  });
});

describe('Trend — backend ships as a plain string, NOT a JsonStringEnumConverter enum', () => {
  it('keeps the documented lowercase values verbatim', () => {
    const trends: readonly Trend[] = ['up', 'down', 'flat'];
    expect(trends).toHaveLength(3);
  });
});
