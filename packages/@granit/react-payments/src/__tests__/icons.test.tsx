import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { resolveMethodIconStyle } from '../icons/method-icon-registry';
import { PaymentMethodIcon } from '../icons/payment-method-icon';
import { ProviderIcon } from '../icons/provider-icon';
import { PaymentsProvider } from '../providers/payments-provider';

import type { PaymentBrandIconResolvers } from '../providers/payments-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

// PaymentsProvider only needs a truthy client; no request is made in these tests.
const STUB_CLIENT = {} as AxiosInstance;

function withBrandIcons(brandIcons: PaymentBrandIconResolvers, ui: ReactNode) {
  return render(
    <PaymentsProvider config={{ client: STUB_CLIENT, brandIcons }}>{ui}</PaymentsProvider>
  );
}

describe('resolveMethodIconStyle', () => {
  it('returns the category style when no method override exists', () => {
    const style = resolveMethodIconStyle('unknown-method', 2); // BankTransfer
    expect(style.bg).toBe('#16A34A');
    expect(style.fg).toBe('#FFFFFF');
  });

  it('merges category icon with method-specific color override', () => {
    const style = resolveMethodIconStyle('bancontact', 1); // BankRedirect category
    expect(style.bg).toBe('#1E5BAA');
    expect(style.fg).toBe('#FFD700');
  });

  it('falls back to Card style when category index is out of range', () => {
    const style = resolveMethodIconStyle('card', 99);
    expect(style.bg).toBe('#4F46E5');
  });
});

describe('PaymentMethodIcon', () => {
  it('renders the generic category badge by default', () => {
    const { container } = render(<PaymentMethodIcon methodType="card" category={0} />);
    const span = container.querySelector('[data-method-type="card"]');
    expect(span).not.toBeNull();
    expect(span?.getAttribute('aria-label')).toBe('card');
  });

  it('renders customIcon when provided and skips the colored badge', () => {
    const { container, getByTestId } = render(
      <PaymentMethodIcon
        methodType="ideal"
        category={1}
        title="iDEAL (licensed)"
        customIcon={<svg data-testid="brand-svg" />}
      />
    );
    expect(getByTestId('brand-svg')).toBeDefined();
    const wrapper = container.querySelector('[data-method-type="ideal"]');
    expect(wrapper?.getAttribute('aria-label')).toBe('iDEAL (licensed)');
    expect(wrapper?.getAttribute('title')).toBe('iDEAL (licensed)');
  });

  it('applies the className prop to the container', () => {
    const { container } = render(
      <PaymentMethodIcon methodType="card" category={0} className="extra-class" />
    );
    const span = container.querySelector('[data-method-type="card"]');
    expect(span?.className).toContain('extra-class');
  });
});

describe('ProviderIcon', () => {
  it('renders the fallback badge for unknown providers', () => {
    const { container } = render(<ProviderIcon providerName="acme-payments" />);
    const span = container.querySelector('[data-provider-name="acme-payments"]');
    expect(span).not.toBeNull();
    expect(span?.getAttribute('aria-label')).toBe('acme-payments');
  });

  it('matches known providers case-insensitively', () => {
    const { container } = render(<ProviderIcon providerName="STRIPE" />);
    const span = container.querySelector<HTMLElement>('[data-provider-name="STRIPE"]');
    expect(span?.style.backgroundColor).toBe('rgb(99, 91, 255)');
  });

  it('renders customIcon when provided', () => {
    const { getByTestId } = render(
      <ProviderIcon providerName="mollie" customIcon={<svg data-testid="brand-provider" />} />
    );
    expect(getByTestId('brand-provider')).toBeDefined();
  });
});

describe('brandIcons resolver via PaymentsProvider', () => {
  it('PaymentMethodIcon uses the method resolver when it returns a node', () => {
    const { getByTestId, container } = withBrandIcons(
      { method: (type) => (type === 'ideal' ? <svg data-testid="ideal-logo" /> : undefined) },
      <PaymentMethodIcon methodType="ideal" category={1} />
    );
    expect(getByTestId('ideal-logo')).toBeDefined();
    // No generic colored badge background when a brand logo is rendered.
    const span = container.querySelector<HTMLElement>('[data-method-type="ideal"]');
    expect(span?.style.backgroundColor).toBe('');
  });

  it('PaymentMethodIcon falls back to the generic badge when the resolver returns undefined', () => {
    const { container } = withBrandIcons(
      { method: () => undefined },
      <PaymentMethodIcon methodType="card" category={0} />
    );
    const span = container.querySelector<HTMLElement>('[data-method-type="card"]');
    expect(span?.style.backgroundColor).not.toBe('');
  });

  it('customIcon prop takes precedence over the method resolver', () => {
    const { getByTestId, queryByTestId } = withBrandIcons(
      { method: () => <svg data-testid="from-resolver" /> },
      <PaymentMethodIcon methodType="ideal" category={1} customIcon={<svg data-testid="from-prop" />} />
    );
    expect(getByTestId('from-prop')).toBeDefined();
    expect(queryByTestId('from-resolver')).toBeNull();
  });

  it('ProviderIcon uses the provider resolver when it returns a node', () => {
    const { getByTestId } = withBrandIcons(
      { provider: (name) => (name === 'stripe' ? <svg data-testid="stripe-logo" /> : undefined) },
      <ProviderIcon providerName="stripe" />
    );
    expect(getByTestId('stripe-logo')).toBeDefined();
  });
});
