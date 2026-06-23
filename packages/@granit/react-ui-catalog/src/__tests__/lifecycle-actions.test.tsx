import { toast } from '@granit/react-ui';
import { workflowTranslationsEn } from '@granit/react-workflow';
import { toEntityId } from '@granit/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, vi } from 'vitest';

import { LifecycleActions } from '../components/lifecycle-actions';

import { renderWithProviders, testI18n } from './test-utils';

import type { ProductId, ProductResponse } from '@granit/catalog';

// The local test i18n only ships the catalog 'translation' bundle.
// `LifecycleActions` consumes `@granit/react-workflow`'s nested 'workflow'
// bundle for dialog title/description/confirm. Register it once so the
// rendered text matches what the user will see in production.
beforeAll(() => {
  testI18n.addResourceBundle('en', 'workflow', workflowTranslationsEn, true, true);
});

// Mutation mocks shared across tests so each assertion can inspect calls.
// The component drives `mutate(id, { onSuccess })`; the default implementation
// invokes onSuccess so the happy path (toast + dialog close) is exercised.
const publishMutate = vi.fn((_id: unknown, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.()
);
const archiveMutate = vi.fn((_id: unknown, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.()
);
let publishPending = false;
let archivePending = false;

vi.mock('@granit/react-catalog', () => ({
  usePublishProduct: () => ({ mutate: publishMutate, isPending: publishPending }),
  useArchiveProduct: () => ({ mutate: archiveMutate, isPending: archivePending }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function buildProduct(status: ProductResponse['lifecycleStatus']): ProductResponse {
  return {
    id: toEntityId<'Product'>('00000000-0000-0000-0000-000000000001') as ProductId,
    sku: 'BASIC',
    name: 'Basic plan',
    description: null,
    type: 'Service',
    unit: 'month',
    lifecycleStatus: status,
    metadata: {},
    externalMappings: [],
  };
}

describe('LifecycleActions', () => {
  const invokeOnSuccess = (_id: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.();

  beforeEach(() => {
    publishMutate.mockReset();
    archiveMutate.mockReset();
    publishMutate.mockImplementation(invokeOnSuccess);
    archiveMutate.mockImplementation(invokeOnSuccess);
    publishPending = false;
    archivePending = false;
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('renders nothing for Archived products (terminal state)', () => {
    const { container } = renderWithProviders(
      <LifecycleActions product={buildProduct('Archived')} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  describe('Draft → Publish (info severity, no strong confirm)', () => {
    it('opens a publish confirm dialog with the framework-provided title', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LifecycleActions product={buildProduct('Draft')} />);

      await user.click(screen.getByRole('button', { name: /publish/i }));

      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveAttribute('data-severity', 'info');
      // Title comes from the workflow namespace bundle (granit-front).
      expect(within(dialog).getByText('Publish this item?')).toBeInTheDocument();
      // Product name surfaces in the description.
      expect(within(dialog).getByText('Basic plan')).toBeInTheDocument();
      // Confirm only fires after the user explicitly clicks the dialog action.
      expect(publishMutate).not.toHaveBeenCalled();
    });

    it('does not show the strong-confirm input for info transitions', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(
        <LifecycleActions product={buildProduct('Draft')} />
      );

      await user.click(screen.getByRole('button', { name: /publish/i }));
      await screen.findByRole('alertdialog');

      expect(container.querySelector('[data-slot="strong-confirm"]')).not.toBeInTheDocument();
    });

    it('publishes after the user confirms in the dialog', async () => {
      const user = userEvent.setup();
      const product = buildProduct('Draft');
      renderWithProviders(<LifecycleActions product={product} />);

      await user.click(screen.getByRole('button', { name: /publish/i }));
      const dialog = await screen.findByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /publish/i }));

      await waitFor(() =>
        expect(publishMutate).toHaveBeenCalledWith(product.id, expect.anything())
      );
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Product published'));
    });

    it('keeps the dialog open on mutation failure so the user can retry', async () => {
      const user = userEvent.setup();
      // Simulate a failed mutation: onSuccess is never invoked.
      publishMutate.mockImplementationOnce(() => undefined);
      renderWithProviders(<LifecycleActions product={buildProduct('Draft')} />);

      await user.click(screen.getByRole('button', { name: /publish/i }));
      const dialog = await screen.findByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /publish/i }));

      // API errors are surfaced by the global MutationCache.onError toast, not
      // locally. The dialog must stay open so the user can retry.
      await waitFor(() => expect(publishMutate).toHaveBeenCalled());
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('cancel button closes the dialog without invoking the mutation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LifecycleActions product={buildProduct('Draft')} />);

      await user.click(screen.getByRole('button', { name: /publish/i }));
      const dialog = await screen.findByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect(publishMutate).not.toHaveBeenCalled();
    });
  });

  describe('Published → Archive (destructive severity, strong confirm)', () => {
    it('flags the archive dialog as destructive and renders the strong-confirm input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LifecycleActions product={buildProduct('Published')} />);

      await user.click(screen.getByRole('button', { name: /archive/i }));

      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveAttribute('data-severity', 'destructive');
      expect(within(dialog).getByText('Archive this item?')).toBeInTheDocument();
      // The user must retype the product name before confirming.
      expect(within(dialog).getByLabelText(/Confirmation input/i)).toBeInTheDocument();
    });

    it('keeps the confirm button disabled until the typed name matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LifecycleActions product={buildProduct('Published')} />);

      await user.click(screen.getByRole('button', { name: /archive/i }));
      const dialog = await screen.findByRole('alertdialog');
      const confirm = within(dialog).getByRole('button', { name: /^archive$/i });
      const input = within(dialog).getByLabelText(/Confirmation input/i);

      expect(confirm).toBeDisabled();

      await user.type(input, 'wrong');
      expect(confirm).toBeDisabled();

      await user.clear(input);
      await user.type(input, 'Basic plan');
      expect(confirm).toBeEnabled();
    });

    it('archives only after a satisfied strong confirm', async () => {
      const user = userEvent.setup();
      const product = buildProduct('Published');
      renderWithProviders(<LifecycleActions product={product} />);

      await user.click(screen.getByRole('button', { name: /archive/i }));
      const dialog = await screen.findByRole('alertdialog');
      const input = within(dialog).getByLabelText(/Confirmation input/i);

      await user.type(input, 'Basic plan');
      await user.click(within(dialog).getByRole('button', { name: /^archive$/i }));

      await waitFor(() =>
        expect(archiveMutate).toHaveBeenCalledWith(product.id, expect.anything())
      );
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Product archived'));
    });
  });

  describe('pending state', () => {
    it('disables the trigger button while the mutation is in flight', () => {
      publishPending = true;
      renderWithProviders(<LifecycleActions product={buildProduct('Draft')} />);

      expect(screen.getByRole('button', { name: /publish/i })).toBeDisabled();
    });
  });
});
