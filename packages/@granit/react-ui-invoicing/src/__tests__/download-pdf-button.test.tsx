import { screen, waitFor } from '@testing-library/react';

import { DownloadPdfButton } from '../components/download-pdf-button';

import { renderWithProviders } from './test-utils';

import type { InvoiceId } from '@granit/invoicing';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUseDownloadInvoicePdf, mockMutateAsync } = vi.hoisted(() => ({
  mockUseDownloadInvoicePdf: vi.fn(),
  mockMutateAsync: vi.fn(),
}));

vi.mock('@granit/react-invoicing', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDownloadInvoicePdf: mockUseDownloadInvoicePdf,
  };
});

const INVOICE_ID = '11111111-1111-1111-1111-111111111111' as InvoiceId;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DownloadPdfButton', () => {
  beforeEach(() => {
    mockMutateAsync.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    mockUseDownloadInvoicePdf.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('should render the download label and data-slot when idle', () => {
    renderWithProviders(<DownloadPdfButton invoiceId={INVOICE_ID} />);
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="download-pdf-button"]')).toBeInTheDocument();
  });

  it('should show the loading label and disable the button while pending', () => {
    mockUseDownloadInvoicePdf.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });
    renderWithProviders(<DownloadPdfButton invoiceId={INVOICE_ID} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should trigger the download and an anchor click using the invoice number', async () => {
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { user } = renderWithProviders(
      <DownloadPdfButton invoiceId={INVOICE_ID} invoiceNumber="INV-2026-0001" />
    );
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(INVOICE_ID);
    });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('should fall back to the invoice id when no invoice number is provided', async () => {
    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    let downloadName = '';
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadName = this.download;
    });

    const { user } = renderWithProviders(<DownloadPdfButton invoiceId={INVOICE_ID} />);
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });
    expect(downloadName).toBe(`invoice-${INVOICE_ID}.pdf`);

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
