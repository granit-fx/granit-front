import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderShell } from './test-utils';

let state: { open: boolean; sheetOpen: boolean };
const setSheetOpen = vi.fn();

vi.mock('../right-sidebar-context', () => ({
  useRightSidebar: () => ({ ...state, setSheetOpen }),
}));

const { AppRightSidebar } = await import('../app-right-sidebar');

beforeEach(() => {
  setSheetOpen.mockClear();
  state = { open: false, sheetOpen: false };
});

describe('AppRightSidebar', () => {
  it('renders the inline aside collapsed when closed', () => {
    state = { open: false, sheetOpen: false };
    renderShell(<AppRightSidebar />);
    const aside = document.querySelector('[data-slot="app-right-sidebar"]');
    expect(aside).toHaveAttribute('data-state', 'collapsed');
    expect(aside).toHaveClass('w-0');
  });

  it('renders the inline aside expanded when open', () => {
    state = { open: true, sheetOpen: false };
    renderShell(<AppRightSidebar />);
    const aside = document.querySelector('[data-slot="app-right-sidebar"]');
    expect(aside).toHaveAttribute('data-state', 'expanded');
    expect(aside).toHaveClass('w-(--sidebar-width)');
  });

  it('shows the mobile Sheet content with its title when the sheet is open', () => {
    state = { open: false, sheetOpen: true };
    renderShell(<AppRightSidebar />);
    expect(screen.getByText('Right sidebar')).toBeInTheDocument();
    // Placeholder body is rendered both inline and in the sheet.
    expect(screen.getAllByText(/Placeholder content/).length).toBeGreaterThan(0);
  });
});
