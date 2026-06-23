import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@granit/react-ui-localization', () => ({
  LanguageSwitcher: () => <div data-slot="language-switcher" />,
}));

const { AppPublicShell } = await import('../app-public-shell');

describe('AppPublicShell', () => {
  it('renders the brand block, children and the language switcher', () => {
    render(
      <AppPublicShell brand={<span>Acme Admin</span>}>
        <p>Sign in form</p>
      </AppPublicShell>
    );

    expect(screen.getByText('Acme Admin')).toBeInTheDocument();
    expect(screen.getByText('Sign in form')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="language-switcher"]')).toBeInTheDocument();
  });

  it('renders the footer slot when provided', () => {
    render(
      <AppPublicShell footer={<span>Need help?</span>}>
        <p>content</p>
      </AppPublicShell>
    );

    expect(screen.getByText('Need help?')).toBeInTheDocument();
  });

  it('omits the brand block when no brand is provided', () => {
    render(
      <AppPublicShell>
        <p>content</p>
      </AppPublicShell>
    );

    expect(screen.getByText('content')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="language-switcher"]')).toBeInTheDocument();
  });
});
