import { TooltipProvider } from '@granit/react-ui';
import { render, screen } from '@testing-library/react';

import { CapabilityBadges, PendingSnapshotBadge } from '../components/capability-badges';

import type { PaymentMethodCapabilityResponse } from '@granit/payments';

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

const emptyCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: [],
  supportedCurrencies: [],
  supportedSequenceTypes: [],
  amountBounds: [],
};

describe('CapabilityBadges — countries', () => {
  it('renders "Global" when the country set is empty (wildcard semantics)', () => {
    renderWithTooltip(<CapabilityBadges capability={emptyCapability} />);
    expect(screen.getByLabelText('Supported worldwide')).toBeInTheDocument();
  });

  it('shows up to 3 country chips and a +N overflow badge', () => {
    renderWithTooltip(
      <CapabilityBadges
        capability={{
          ...emptyCapability,
          supportedCountries: ['BE', 'NL', 'FR', 'DE', 'ES'],
        }}
      />
    );
    expect(screen.getByLabelText('Supported in BE')).toBeInTheDocument();
    expect(screen.getByLabelText('Supported in NL')).toBeInTheDocument();
    expect(screen.getByLabelText('Supported in FR')).toBeInTheDocument();
    expect(screen.queryByLabelText('Supported in DE')).not.toBeInTheDocument();
    expect(screen.getByLabelText('2 more countries')).toBeInTheDocument();
  });
});

describe('CapabilityBadges — currencies', () => {
  it('renders "All currencies" when set is empty', () => {
    renderWithTooltip(<CapabilityBadges capability={emptyCapability} />);
    expect(screen.getByLabelText('All currencies supported')).toBeInTheDocument();
  });

  it('renders individual currency chips with aria-labels', () => {
    renderWithTooltip(
      <CapabilityBadges capability={{ ...emptyCapability, supportedCurrencies: ['EUR', 'GBP'] }} />
    );
    expect(screen.getByLabelText('Accepts EUR')).toBeInTheDocument();
    expect(screen.getByLabelText('Accepts GBP')).toBeInTheDocument();
  });
});

describe('CapabilityBadges — sequences', () => {
  it('expands an empty set to all three sequence types (wildcard)', () => {
    renderWithTooltip(<CapabilityBadges capability={emptyCapability} />);
    expect(screen.getByLabelText('OneOff sequence')).toBeInTheDocument();
    expect(screen.getByLabelText('First sequence')).toBeInTheDocument();
    expect(screen.getByLabelText('Recurring sequence')).toBeInTheDocument();
  });

  it('renders only the sequence types present in the set', () => {
    renderWithTooltip(
      <CapabilityBadges capability={{ ...emptyCapability, supportedSequenceTypes: ['oneoff'] }} />
    );
    expect(screen.getByLabelText('OneOff sequence')).toBeInTheDocument();
    expect(screen.queryByLabelText('Recurring sequence')).not.toBeInTheDocument();
  });
});

describe('CapabilityBadges — amount bounds', () => {
  it('renders "Unlimited" when bounds array is empty', () => {
    renderWithTooltip(<CapabilityBadges capability={emptyCapability} />);
    expect(screen.getByLabelText('No amount limits')).toBeInTheDocument();
  });

  it('formats a single EUR range using Intl.NumberFormat', () => {
    renderWithTooltip(
      <CapabilityBadges
        capability={{
          ...emptyCapability,
          amountBounds: [{ currencyCode: 'EUR', minAmount: 100, maxAmount: 1000000 }],
        }}
      />
    );
    // We don't assert exact punctuation because Intl output varies by locale —
    // but the label should start with "EUR " and contain both numbers.
    const badge = screen.getByText(/^EUR .* – .*$/);
    expect(badge).toBeInTheDocument();
  });

  it('shows "≥" when only a floor is set', () => {
    renderWithTooltip(
      <CapabilityBadges
        capability={{
          ...emptyCapability,
          amountBounds: [{ currencyCode: 'EUR', minAmount: 100, maxAmount: null }],
        }}
      />
    );
    expect(screen.getByText(/EUR ≥/)).toBeInTheDocument();
  });

  it('shows "≤" when only a ceiling is set', () => {
    renderWithTooltip(
      <CapabilityBadges
        capability={{
          ...emptyCapability,
          amountBounds: [{ currencyCode: 'EUR', minAmount: null, maxAmount: 1000000 }],
        }}
      />
    );
    expect(screen.getByText(/EUR ≤/)).toBeInTheDocument();
  });

  it('collapses multiple currencies into a summary badge with tooltip detail', () => {
    renderWithTooltip(
      <CapabilityBadges
        capability={{
          ...emptyCapability,
          amountBounds: [
            { currencyCode: 'EUR', minAmount: 100, maxAmount: 1000000 },
            { currencyCode: 'GBP', minAmount: 100, maxAmount: 500000 },
          ],
        }}
      />
    );
    expect(screen.getByText('2 amount ranges')).toBeInTheDocument();
  });
});

describe('PendingSnapshotBadge', () => {
  it('renders with an explicit aria-label', () => {
    renderWithTooltip(<PendingSnapshotBadge />);
    expect(screen.getByLabelText('Capability snapshot pending')).toBeInTheDocument();
  });
});
