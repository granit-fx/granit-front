import { render } from '@testing-library/react';

import { ExternalProviderIcon } from '../external-provider-icon';

describe('ExternalProviderIcon', () => {
  it.each(['google', 'microsoft', 'apple', 'github', 'facebook'])(
    'should render a branded svg glyph for %s',
    (provider) => {
      const { container } = render(<ExternalProviderIcon provider={provider} />);
      const svg = container.querySelector('svg[data-slot="external-provider-icon"]');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('path')).toBeInTheDocument();
    }
  );

  it('should match the provider key case-insensitively', () => {
    const { container } = render(<ExternalProviderIcon provider="GOOGLE" />);
    expect(container.querySelector('svg path')).toBeInTheDocument();
  });

  it('should fall back to the key glyph for an unknown provider', () => {
    const { container } = render(<ExternalProviderIcon provider="custom-oidc" />);
    // The KeyRound fallback is a lucide svg without an explicit single brand path.
    const icon = container.querySelector('[data-slot="external-provider-icon"]');
    expect(icon).toBeInTheDocument();
    expect(icon?.tagName.toLowerCase()).toBe('svg');
  });

  it('should forward the className to the rendered icon', () => {
    const { container } = render(
      <ExternalProviderIcon provider="google" className="mr-2 h-4 w-4" />
    );
    expect(container.querySelector('.mr-2')).toBeInTheDocument();
  });
});
