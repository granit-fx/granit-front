import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { TemplateForm } from '../components/template-form';

import { renderWithProviders } from './test-utils';

// The form builds a spec-driven resolver from
// `templatingConstraints.SaveTemplateRequest` and layers two client-only `name`
// guards on top (minimum length 3 + PascalCase). These tests pin that augmented
// behaviour — the same rules the removed zod schema enforced.

vi.mock('@granit/react-templating', () => ({
  TemplatingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTemplateLayouts: () => ({ data: [], isLoading: false }),
}));

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const utils = renderWithProviders(
    <TemplateForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} isSubmitting={false} />
  );
  return { ...utils, onSubmit };
}

describe('TemplateForm validation', () => {
  it('rejects a name shorter than 3 characters', async () => {
    const { user, onSubmit } = renderForm();
    await user.type(
      screen.getByPlaceholderText('Domain.TemplateName (e.g., Billing.Invoice)'),
      'Ab'
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('The name must be at least 3 characters long')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a single-segment name (no dot separator)', async () => {
    const { user, onSubmit } = renderForm();
    await user.type(
      screen.getByPlaceholderText('Domain.TemplateName (e.g., Billing.Invoice)'),
      'Invoice'
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Format: Domain.Name (e.g., Billing.Invoice)')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a name with a lowercase segment start (PascalCase enforced)', async () => {
    const { user, onSubmit } = renderForm();
    await user.type(
      screen.getByPlaceholderText('Domain.TemplateName (e.g., Billing.Invoice)'),
      'billing.Invoice'
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Format: Domain.Name (e.g., Billing.Invoice)')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts a valid PascalCase dotted name', async () => {
    const { user } = renderForm();
    await user.type(
      screen.getByPlaceholderText('Domain.TemplateName (e.g., Billing.Invoice)'),
      'Billing.Invoice.Reminder'
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(
        screen.queryByText('Format: Domain.Name (e.g., Billing.Invoice)')
      ).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        screen.queryByText('The name must be at least 3 characters long')
      ).not.toBeInTheDocument()
    );
  });
});
