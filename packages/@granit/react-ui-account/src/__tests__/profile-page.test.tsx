import { screen, waitFor } from '@testing-library/react';

import { ProfilePage } from '../profile-page';

import { renderWithProviders } from './test-utils';

import type { AccountProfileResponse } from '@granit/account';

// ---------------------------------------------------------------------------
// Stub the account profile data + update-mutation hooks. Reassign `profileState`
// per test before rendering.
// ---------------------------------------------------------------------------

const { mockUseProfile, mockMutateAsync } = vi.hoisted(() => ({
  mockUseProfile: vi.fn(),
  mockMutateAsync: vi.fn(),
}));

vi.mock('@granit/react-account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useProfile: mockUseProfile,
    useUpdateProfile: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  };
});

const mockProfile: AccountProfileResponse = {
  userId: '894c3628-9424-5a2d-ab57-ba0535dffac8' as AccountProfileResponse['userId'],
  email: 'ada@example.com',
  emailConfirmed: true,
  firstName: 'Ada',
  lastName: 'Lovelace',
  twoFactorEnabled: false,
  hasPassword: true,
  externalLogins: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProfilePage', () => {
  it('should show the loading spinner while the profile loads', () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<ProfilePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render the page title and the read-only profile details', () => {
    mockUseProfile.mockReturnValue({ data: mockProfile, isLoading: false });
    renderWithProviders(<ProfilePage />);

    expect(document.querySelector('[data-slot="profile-page"]')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your personal information')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    // emailConfirmed: true → "Yes"
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('should switch to the edit form pre-filled when Edit is clicked', async () => {
    mockUseProfile.mockReturnValue({ data: mockProfile, isLoading: false });
    const { user } = renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    await waitFor(() => {
      expect(screen.getByLabelText('First name')).toHaveValue('Ada');
    });
    expect(screen.getByLabelText('Last name')).toHaveValue('Lovelace');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('should call the update mutation when Save is clicked', async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    mockUseProfile.mockReturnValue({ data: mockProfile, isLoading: false });
    const { user } = renderWithProviders(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockMutateAsync).toHaveBeenCalledWith({ firstName: 'Ada', lastName: 'Lovelace' });
  });
});
