import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PrivacyOptOutPage } from '../privacy-opt-out-page';

import { renderWithProviders } from './test-utils';

const hookState = {
  status: {
    data: { isOptedOut: false, optedOutAt: null, regulation: 'CCPA' },
    isLoading: false,
  } as Record<string, unknown>,
};

const mutate = vi.fn();

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useOptOutStatus: () => hookState.status,
    useRequestOptOut: () => ({ mutate, isPending: false }),
  };
});

describe('PrivacyOptOutPage', () => {
  beforeEach(() => {
    mutate.mockReset();
    hookState.status = {
      data: { isOptedOut: false, optedOutAt: null, regulation: 'CCPA' },
      isLoading: false,
    };
  });

  it('should render the page title and have data-slot attribute', () => {
    renderWithProviders(<PrivacyOptOutPage />);
    expect(screen.getByText('Data Sale Opt-Out')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="privacy-opt-out-page"]')).toBeInTheDocument();
  });

  it('should render the active (not opted out) status with the opt-out button', () => {
    renderWithProviders(<PrivacyOptOutPage />);
    expect(screen.getByText('Current Status')).toBeInTheDocument();
    expect(screen.getByText('Active (not opted out)')).toBeInTheDocument();
    expect(screen.getByText('Regulation: CCPA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Opt Out/i })).toBeInTheDocument();
  });

  it('should render the opted-out badge when already opted out', () => {
    hookState.status = {
      data: { isOptedOut: true, optedOutAt: '2026-01-01T00:00:00Z', regulation: 'CCPA' },
      isLoading: false,
    };
    renderWithProviders(<PrivacyOptOutPage />);
    expect(screen.getByText('Opted Out')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Opt Out$/i })).not.toBeInTheDocument();
  });

  it('should open the confirm dialog and trigger the mutation on confirm', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyOptOutPage />);

    await user.click(screen.getByRole('button', { name: /Opt Out/i }));

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Confirm Opt-Out' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm Opt-Out' }));
    expect(mutate).toHaveBeenCalled();
  });
});
