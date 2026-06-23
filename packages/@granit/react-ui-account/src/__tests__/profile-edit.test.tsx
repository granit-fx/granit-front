import { mockProfile } from '@granit/react-account/testing';
import { screen, waitFor } from '@testing-library/react';

import { ProfilePage } from '../profile-page';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Profile edit flow: field edits, cancel, and the save error path. Render-only
// states are covered by the co-located ProfilePage test; this file drives the
// editable form to exercise the onChange handlers and the catch branch.
// ---------------------------------------------------------------------------

const { mockUseProfile, mockUpdate } = vi.hoisted(() => ({
  mockUseProfile: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useProfile: mockUseProfile,
    useUpdateProfile: () => ({ mutateAsync: mockUpdate, isPending: false }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseProfile.mockReturnValue({ data: mockProfile, isLoading: false });
});

describe('ProfilePage — edit flow', () => {
  it('should edit both names and save the new values', async () => {
    mockUpdate.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const firstName = await screen.findByLabelText('First name');
    const lastName = screen.getByLabelText('Last name');
    await user.clear(firstName);
    await user.type(firstName, 'Grace');
    await user.clear(lastName);
    await user.type(lastName, 'Hopper');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockUpdate).toHaveBeenCalledWith({ firstName: 'Grace', lastName: 'Hopper' });
  });

  it('should leave edit mode and discard edits on cancel', async () => {
    const { user } = renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const firstName = await screen.findByLabelText('First name');
    await user.clear(firstName);
    await user.type(firstName, 'Temporary');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Temporary')).not.toBeInTheDocument();
    expect(screen.getByText(mockProfile.firstName!)).toBeInTheDocument();
  });

  it('should stay in edit mode when the save mutation fails', async () => {
    mockUpdate.mockRejectedValue(new Error('server error'));
    const { user } = renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await screen.findByLabelText('First name');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
  });

  it('should render an em dash placeholder for empty name fields', () => {
    mockUseProfile.mockReturnValue({
      data: { ...mockProfile, firstName: '', lastName: '', emailConfirmed: false },
      isLoading: false,
    });
    renderWithProviders(<ProfilePage />);

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    // emailConfirmed: false → "No"
    expect(screen.getByText('No')).toBeInTheDocument();
  });
});
