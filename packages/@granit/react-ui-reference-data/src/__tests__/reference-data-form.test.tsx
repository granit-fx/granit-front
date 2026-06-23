import { screen, waitFor } from '@testing-library/react';

import { ReferenceDataForm } from '../components/reference-data-form';
import { createReferenceDataConstraints, editReferenceDataConstraints } from '../validation';

import { renderWithProviders } from './test-utils';

import type { ReferenceDataFormValues } from '../components/types';
import type { UseFormReturn } from 'react-hook-form';

describe('ReferenceDataForm', () => {
  describe('create mode', () => {
    it('renders the code card only in create mode', () => {
      const { rerender } = renderWithProviders(
        <ReferenceDataForm
          mode="create"
          constraints={createReferenceDataConstraints}
          onCancel={vi.fn()}
          onSubmit={vi.fn()}
        />
      );
      expect(screen.getByPlaceholderText('CODE')).toBeInTheDocument();

      rerender(
        <ReferenceDataForm
          mode="edit"
          constraints={editReferenceDataConstraints}
          onCancel={vi.fn()}
          onSubmit={vi.fn()}
        />
      );
      expect(screen.queryByPlaceholderText('CODE')).not.toBeInTheDocument();
    });

    it('uppercases the code input as the user types', async () => {
      const { user } = renderWithProviders(
        <ReferenceDataForm
          mode="create"
          constraints={createReferenceDataConstraints}
          onCancel={vi.fn()}
          onSubmit={vi.fn()}
        />
      );
      const code = screen.getByPlaceholderText('CODE');
      await user.type(code, 'be');
      expect(code).toHaveValue('BE');
    });

    it('submits valid data', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { user } = renderWithProviders(
        <ReferenceDataForm
          mode="create"
          constraints={createReferenceDataConstraints}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />
      );
      await user.type(screen.getByPlaceholderText('CODE'), 'BE');
      await user.type(screen.getByLabelText('Label (English)'), 'Belgium');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      const payload = onSubmit.mock.calls[0]![0] as ReferenceDataFormValues;
      expect(payload.code).toBe('BE');
      expect(payload.labelEn).toBe('Belgium');
    });

    it('blocks submission and surfaces an error when required fields are missing', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { user } = renderWithProviders(
        <ReferenceDataForm
          mode="create"
          constraints={createReferenceDataConstraints}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => {
        expect(screen.getAllByText('Validation:Builtin:NotEmpty').length).toBeGreaterThan(0);
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('submits the labels without a code field', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { user } = renderWithProviders(
        <ReferenceDataForm
          mode="edit"
          constraints={editReferenceDataConstraints}
          defaultValues={{ labelEn: 'Belgium' }}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      const payload = onSubmit.mock.calls[0]![0] as Record<string, unknown>;
      expect(payload.labelEn).toBe('Belgium');
      expect(payload.code).toBeUndefined();
    });
  });

  it('renders the parent-code field when showParentCode is set', () => {
    renderWithProviders(
      <ReferenceDataForm
        mode="edit"
        constraints={editReferenceDataConstraints}
        showParentCode
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Parent Code')).toBeInTheDocument();
  });

  it('renders extra fields via the renderExtraFields slot', () => {
    const renderExtraFields = vi.fn((_form: UseFormReturn<ReferenceDataFormValues>) => (
      <div data-testid="extra">extra</div>
    ));
    renderWithProviders(
      <ReferenceDataForm
        mode="edit"
        constraints={editReferenceDataConstraints}
        renderExtraFields={renderExtraFields}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByTestId('extra')).toBeInTheDocument();
    expect(renderExtraFields).toHaveBeenCalled();
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const { user } = renderWithProviders(
      <ReferenceDataForm
        mode="edit"
        constraints={editReferenceDataConstraints}
        onCancel={onCancel}
        onSubmit={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables the save button and shows a pending indicator when isPending', () => {
    renderWithProviders(
      <ReferenceDataForm
        mode="edit"
        constraints={editReferenceDataConstraints}
        isPending
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    const save = screen.getByRole('button', { name: '...' });
    expect(save).toBeDisabled();
  });

  it('appends a metadata row through the embedded editor', async () => {
    const { user } = renderWithProviders(
      <ReferenceDataForm
        mode="edit"
        constraints={editReferenceDataConstraints}
        extraPropertySuggestions={['iso2']}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /Add property/ }));
    expect(screen.getByPlaceholderText('Key')).toBeInTheDocument();
  });
});
