import { render } from '@testing-library/react';

import { ExternalProviderIcon } from './external-provider-icon';

describe('ExternalProviderIcon', () => {
  it('renders a branded icon for a known provider', () => {
    const { container } = render(<ExternalProviderIcon provider="GitHub" />);
    expect(container.querySelector('svg[data-slot="external-provider-icon"]')).toBeInTheDocument();
  });

  it('renders the fallback glyph for an unknown scheme', () => {
    // The generic key glyph keeps custom OIDC schemes renderable.
    const { container } = render(<ExternalProviderIcon provider="keycloak-corp" />);
    expect(container.querySelector('svg[data-slot="external-provider-icon"]')).toBeInTheDocument();
  });
});
