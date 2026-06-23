import { screen, waitFor } from '@testing-library/react';

import { CreateInvoiceDialog } from '../components/create-invoice-dialog';

import { renderWithProviders } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseCreateInvoice, mockMutateAsync } = vi.hoisted(() => ({
  mockUseCreateInvoice: vi.fn(),
  mockMutateAsync: vi.fn(),
}));

vi.mock('@granit/react-invoicing', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useCreateInvoice: mockUseCreateInvoice,
  };
});

const { mockToastSuccess } = vi.hoisted(() => ({ mockToastSuccess: vi.fn() }));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess },
}));

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }));
vi.mock('../logger', () => ({
  logger: { error: mockLoggerError },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateInvoiceDialog', () => {
  beforeEach(() => {
    mockMutateAsync.mockResolvedValue({});
    mockUseCreateInvoice.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('should not render the dialog content when closed', () => {
    renderWithProviders(<CreateInvoiceDialog open={false} onOpenChange={vi.fn()} />);
    expect(document.querySelector('[data-slot="create-invoice-dialog"]')).not.toBeInTheDocument();
  });

  it('should render the dialog title, description and field labels when open', () => {
    renderWithProviders(<CreateInvoiceDialog open onOpenChange={vi.fn()} />);
    expect(document.querySelector('[data-slot="create-invoice-dialog"]')).toBeInTheDocument();
    expect(screen.getByText('Create a new invoice for a customer.')).toBeInTheDocument();
    expect(screen.getByText('Party')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Period Start')).toBeInTheDocument();
    expect(screen.getByText('Period End')).toBeInTheDocument();
  });

  it('should call onOpenChange(false) when the cancel button is clicked', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<CreateInvoiceDialog open onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should keep the form invalid (no mutation) when partyId is empty', async () => {
    const { user } = renderWithProviders(<CreateInvoiceDialog open onOpenChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('should submit, toast success, reset and close on a valid submission', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<CreateInvoiceDialog open onOpenChange={onOpenChange} />);

    const partyInput = screen.getByPlaceholderText('party-uuid');
    await user.type(partyInput, 'party-123');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        partyId: 'party-123',
        currency: 'EUR',
        documentType: 'Invoice',
        collectionMethod: 'ChargeAutomatically',
        billingReason: 'Manual',
        parentInvoiceId: null,
        creditNoteReason: null,
        periodStart: null,
        periodEnd: null,
      })
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('Invoice created successfully');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should send ISO period bounds when the period fields are filled', async () => {
    const { user } = renderWithProviders(<CreateInvoiceDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('party-uuid'), 'party-123');

    const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
    await user.type(dateInputs[0] as HTMLInputElement, '2026-01-01T00:00');
    await user.type(dateInputs[1] as HTMLInputElement, '2026-02-01T00:00');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
    const payload = mockMutateAsync.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.periodStart).toBe('2026-01-01T00:00');
    expect(payload.periodEnd).toBe('2026-02-01T00:00');
  });

  it('should log the error and not close when the mutation fails', async () => {
    const onOpenChange = vi.fn();
    mockMutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<CreateInvoiceDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByPlaceholderText('party-uuid'), 'party-123');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockLoggerError).toHaveBeenCalledTimes(1);
    });
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('should disable the actions and show the loading label while pending', () => {
    mockUseCreateInvoice.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });
    renderWithProviders(<CreateInvoiceDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
  });
});
