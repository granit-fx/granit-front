import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_PRESENCE_COLORS, PresenceDot } from '../components/presence-dot.js';

import type { PresenceStatus } from '@granit/presence';

describe('PresenceDot', () => {
  it.each<PresenceStatus>(['Online', 'Away', 'Busy', 'DoNotDisturb', 'Offline'])(
    'renders the default colour for %s',
    (status) => {
      const { container } = render(<PresenceDot status={status} />);
      const dot = container.querySelector('[data-granit-presence-dot]')!;
      expect(dot.getAttribute('data-status')).toBe(status);
      expect((dot as HTMLElement).style.backgroundColor).toBeTruthy();
      expect(dot.getAttribute('aria-label')).toBeTruthy();
      // sanity-check the colour map exposed publicly is the one used.
      expect(DEFAULT_PRESENCE_COLORS[status]).toBeDefined();
    }
  );

  it('honours a custom colour map', () => {
    const { container } = render(
      <PresenceDot status="Online" colorMap={{ Online: 'rgb(1, 2, 3)' }} />
    );
    const dot = container.querySelector('[data-granit-presence-dot]') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
