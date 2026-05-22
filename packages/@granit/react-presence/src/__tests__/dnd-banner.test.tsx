import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DndBanner } from '../components/dnd-banner.js';
import { mockMyPresence } from '../testing/data.js';

describe('DndBanner', () => {
  it('renders nothing when there is no override', () => {
    const { container } = render(<DndBanner presence={mockMyPresence} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the DnD copy with a clear button that fires the callback', async () => {
    const onClear = vi.fn();
    render(
      <DndBanner
        presence={{ ...mockMyPresence, manualOverride: 'DoNotDisturb' }}
        onClear={onClear}
      />
    );
    expect(screen.getByRole('status')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /clear status/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('shows the AppearOffline copy when override = AppearOffline', () => {
    render(<DndBanner presence={{ ...mockMyPresence, manualOverride: 'AppearOffline' }} />);
    expect(screen.getByText(/appear offline/i)).toBeTruthy();
  });
});
