import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ValidateTaxForm } from '../components/validate-tax-form';

import { renderWithProviders } from './test-utils';

describe('ValidateTaxForm', () => {
  it('renders the tax id and country code fields', () => {
    renderWithProviders(<ValidateTaxForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Tax ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Country Code')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<ValidateTaxForm onSubmit={vi.fn()} />);
    expect(document.querySelector('[data-slot="validate-tax-form"]')).toBeInTheDocument();
  });

  it('disables the submit button while pending', () => {
    renderWithProviders(<ValidateTaxForm onSubmit={vi.fn()} isPending />);
    expect(screen.getByRole('button', { name: 'Validate' })).toBeDisabled();
  });

  it('blocks submission and surfaces spec-driven errors on empty input', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<ValidateTaxForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('submits the entered values when valid', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<ValidateTaxForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Tax ID'), 'BE0123456789');
    await user.type(screen.getByLabelText('Country Code'), 'BE');
    await user.click(screen.getByRole('button', { name: 'Validate' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ taxId: 'BE0123456789', countryCode: 'BE' })
    );
  });
});
