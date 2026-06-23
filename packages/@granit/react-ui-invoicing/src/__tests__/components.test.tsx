import { render, screen } from '@testing-library/react';

import { InvoiceLineItems } from '../components/invoice-line-items';
import { InvoiceStatusBadge } from '../components/invoice-status-badge';

import { renderWithProviders } from './test-utils';

import type { InvoiceLineItemResponse } from '@granit/invoicing';

// ---------------------------------------------------------------------------
// InvoiceLineItems
// ---------------------------------------------------------------------------

const lineItem: InvoiceLineItemResponse = {
  id: 'line-1',
  description: 'Consulting services',
  quantity: 2,
  unitPrice: 5000,
  amount: 10000,
  taxRate: 21,
  taxAmount: 2100,
  sourceType: 'Manual',
  sourceId: null,
  periodStart: null,
  periodEnd: null,
};

describe('InvoiceLineItems', () => {
  it('should render the empty-state message when there are no line items', () => {
    renderWithProviders(<InvoiceLineItems lineItems={[]} currency="EUR" />);
    expect(screen.getByText('No line items')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="invoice-line-items"]')).not.toBeInTheDocument();
  });

  it('should render a table row per line item with formatted currency', () => {
    renderWithProviders(<InvoiceLineItems lineItems={[lineItem]} currency="EUR" />);
    expect(document.querySelector('[data-slot="invoice-line-items"]')).toBeInTheDocument();
    expect(screen.getByText('Consulting services')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('€50.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('€100.00')).toBeInTheDocument();
    expect(screen.getByText(/21%/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// InvoiceStatusBadge
// ---------------------------------------------------------------------------

describe('InvoiceStatusBadge', () => {
  it('should render a known status with its variant', () => {
    render(<InvoiceStatusBadge status="Paid" />);
    const badge = document.querySelector('[data-slot="invoice-status-badge"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Paid');
    expect(badge?.className).toContain('text-success-600');
  });

  it('should fall back to the Draft variant for an unknown status', () => {
    render(<InvoiceStatusBadge status="Mystery" />);
    const badge = document.querySelector('[data-slot="invoice-status-badge"]');
    expect(badge).toHaveTextContent('Mystery');
    expect(badge?.className).toContain('text-muted-foreground');
  });
});
