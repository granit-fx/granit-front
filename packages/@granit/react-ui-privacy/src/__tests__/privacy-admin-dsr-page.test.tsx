import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PrivacyAdminDsrPage } from '../privacy-admin-dsr-page';

import { renderWithProviders } from './test-utils';

const scopes = [
  {
    providerName: 'profile',
    displayKey: 'Profile',
    featureName: null,
    defaultSelected: true,
    estimatedSizeBytes: null,
  },
  {
    providerName: 'orders',
    displayKey: 'Orders',
    featureName: null,
    defaultSelected: false,
    estimatedSizeBytes: null,
  },
];

const mutate = vi.fn();

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useExportScopes: () => ({ data: scopes, isLoading: false }),
    useRequestExportOnBehalfOf: () => ({ mutate, isPending: false, isSuccess: false }),
  };
});

describe('PrivacyAdminDsrPage', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('should render the page title and have data-slot attribute', () => {
    renderWithProviders(<PrivacyAdminDsrPage />);
    expect(screen.getByText('Admin DSR — Export on Behalf Of')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="privacy-admin-dsr-page"]')).toBeInTheDocument();
  });

  it('should render the request form with subject id field and scopes', () => {
    renderWithProviders(<PrivacyAdminDsrPage />);
    expect(screen.getByLabelText('Subject User ID')).toBeInTheDocument();
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();
  });

  it('should disable the request button until a subject user id is entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyAdminDsrPage />);

    const button = screen.getByRole('button', { name: 'Request Export' });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('Subject User ID'), 'user-123');
    expect(button).toBeEnabled();
  });

  it('should request the export on behalf of the subject when submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyAdminDsrPage />);

    await user.type(screen.getByLabelText('Subject User ID'), 'user-123');
    await user.click(screen.getByRole('button', { name: 'Request Export' }));

    expect(mutate).toHaveBeenCalledWith(
      { subjectUserId: 'user-123', scopes: null },
      expect.anything()
    );
  });
});
