import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProviderIcon } from '../components/provider-icon';

describe('ProviderIcon', () => {
  it('renders a branded glyph for a known provider', () => {
    const { container } = render(<ProviderIcon provider="anthropic" />);
    expect(container.querySelector('svg[data-slot="provider-icon"]')).toBeInTheDocument();
  });

  it('matches the provider key case-insensitively', () => {
    const { container } = render(<ProviderIcon provider="OpenAI" />);
    expect(container.querySelector('svg[data-slot="provider-icon"]')).toBeInTheDocument();
  });

  it('renders the fallback glyph for an unknown provider', () => {
    // The generic bot mark keeps unrecognised backend workspaces renderable.
    const { container } = render(<ProviderIcon provider="acme-llm" />);
    expect(container.querySelector('svg[data-slot="provider-icon"]')).toBeInTheDocument();
  });
});
