import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReferenceRewriterSummary } from '../components/reference-rewriter-summary';

describe('ReferenceRewriterSummary', () => {
  it('renders the empty state when every count is zero', () => {
    render(
      <ReferenceRewriterSummary
        rewriteCounts={{ 'Invoice.PartyId': 0 }}
        labels={{ empty: 'Nothing to rewrite' }}
      />
    );
    expect(screen.getByText('Nothing to rewrite')).toBeInTheDocument();
  });

  it('lists only non-zero rewriters, applying the label and row translators', () => {
    render(
      <ReferenceRewriterSummary
        rewriteCounts={{ 'Invoice.PartyId': 17, 'Subscription.PartyId': 3, 'Payment.PartyId': 0 }}
        labels={{ empty: 'Nothing to rewrite' }}
        translateLabel={(key) => (key === 'Invoice.PartyId' ? 'Invoices' : 'Subscriptions')}
        translateRows={(count) => `${count} rows`}
      />
    );
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('17 rows')).toBeInTheDocument();
    // Payment.PartyId has a zero count → hidden
    expect(screen.queryByText('Payments')).not.toBeInTheDocument();
  });

  it('falls back to raw keys and String() counts without translators', () => {
    render(
      <ReferenceRewriterSummary
        rewriteCounts={{ 'Invoice.PartyId': 5 }}
        labels={{ empty: 'Nothing' }}
      />
    );
    expect(screen.getByText('Invoice.PartyId')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
