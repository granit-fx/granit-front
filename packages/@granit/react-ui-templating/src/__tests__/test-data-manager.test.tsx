import { screen, waitFor } from '@testing-library/react';

import { TestDataManager } from '../components/test-data-manager';

import { renderWithProviders } from './test-utils';

vi.mock('../logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const STORAGE_KEY = 'granit-showcase-admin:test-data';

function seed(templateName: string, datasets: { id: string; name: string; data: string }[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ [templateName]: datasets }));
}

describe('TestDataManager', () => {
  beforeEach(() => localStorage.clear());

  it('should render the trigger controls', () => {
    renderWithProviders(
      <TestDataManager templateName="welcome" currentData="{}" onLoad={vi.fn()} />
    );
    expect(screen.getByText('Test Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
  });

  it('should save the current data under a name via the popover', async () => {
    const { user } = renderWithProviders(
      <TestDataManager templateName="welcome" currentData='{ "x": 1 }' onLoad={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: /Save/ }));
    const input = await screen.findByPlaceholderText('Test Data');
    await user.type(input, 'My dataset');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.welcome).toHaveLength(1);
      expect(stored.welcome[0].name).toBe('My dataset');
    });
  });

  it('should not save when the name is blank', async () => {
    const { user } = renderWithProviders(
      <TestDataManager templateName="welcome" currentData="{}" onLoad={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: /Save/ }));
    await screen.findByPlaceholderText('Test Data');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should save on Enter key', async () => {
    const { user } = renderWithProviders(
      <TestDataManager templateName="welcome" currentData="{}" onLoad={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: /Save/ }));
    const input = await screen.findByPlaceholderText('Test Data');
    await user.type(input, 'Via enter{Enter}');
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.welcome?.[0]?.name).toBe('Via enter');
    });
  });

  it('should load a saved dataset through the select', async () => {
    seed('welcome', [{ id: 'd1', name: 'Saved set', data: '{ "loaded": true }' }]);
    const onLoad = vi.fn();
    const { user } = renderWithProviders(
      <TestDataManager templateName="welcome" currentData="{}" onLoad={onLoad} />
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Saved set'));
    expect(onLoad).toHaveBeenCalledWith('{ "loaded": true }');
  });

  it('should remove a saved dataset', async () => {
    seed('welcome', [{ id: 'd1', name: 'Removable', data: '{}' }]);
    const { user } = renderWithProviders(
      <TestDataManager templateName="welcome" currentData="{}" onLoad={vi.fn()} />
    );
    await user.click(screen.getByRole('combobox'));
    await screen.findByText('Removable');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      expect(stored.welcome).toHaveLength(0);
    });
  });

  it('should show a no-results message when there are no datasets', async () => {
    const { user } = renderWithProviders(
      <TestDataManager templateName="welcome" currentData="{}" onLoad={vi.fn()} />
    );
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });
});
