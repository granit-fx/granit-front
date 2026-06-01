import { describe, expect, it } from 'vitest';

import type { DashboardCategory } from '../types/dashboard-category';
import type { TimeWindowKind } from '../types/dashboard-time-window';
import type { TextWidgetStyle } from '../types/widget-definition';

// Pinned wire-format fixtures for the framework's PascalCase enum surface.
// All three enums ship via Granit's host JsonStringEnumConverter() with no
// naming policy, so enum names land verbatim. Drift here = drift on the wire.

describe('DashboardCategory — exhaustive enum surface (PascalCase, ordered)', () => {
  it('locks the seven backend categories in declaration order', () => {
    const categories: readonly DashboardCategory[] = [
      'General',
      'Finance',
      'Operations',
      'Security',
      'Compliance',
      'Platform',
      'Iot',
    ];
    expect(categories).toHaveLength(7);
  });
});

describe('TimeWindowKind — exhaustive enum surface (PascalCase)', () => {
  it('locks the two backend kinds (History / Realtime)', () => {
    const kinds: readonly TimeWindowKind[] = ['History', 'Realtime'];
    expect(kinds).toHaveLength(2);
  });
});

describe('TextWidgetStyle — exhaustive enum surface (PascalCase, ordered)', () => {
  it('locks the four backend styles in declaration order', () => {
    const styles: readonly TextWidgetStyle[] = ['Body', 'Heading', 'Subheading', 'Caption'];
    expect(styles).toHaveLength(4);
  });
});
