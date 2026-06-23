import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HistoryFilters } from '../components/history-filters';

import { renderDataExchange } from './test-utils';

describe('HistoryFilters', () => {
  it('should render the status filter trigger for export mode', () => {
    renderDataExchange(
      <HistoryFilters mode="export" status={undefined} onStatusChange={vi.fn()} />
    );
    expect(document.querySelector('[data-slot="history-filters"]')).toBeInTheDocument();
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-label', 'Status');
  });

  it('should reflect a selected status value', () => {
    renderDataExchange(
      <HistoryFilters mode="import" status="Completed" onStatusChange={vi.fn()} />
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should open the dropdown and emit the chosen status', async () => {
    const onStatusChange = vi.fn();
    const { user } = renderDataExchange(
      <HistoryFilters mode="import" status={undefined} onStatusChange={onStatusChange} />
    );
    await user.click(screen.getByRole('combobox'));
    const option = await screen.findByRole('option', { name: 'Completed' });
    await user.click(option);
    expect(onStatusChange).toHaveBeenCalledWith('Completed');
  });

  it('should emit undefined when the "all" option is selected', async () => {
    const onStatusChange = vi.fn();
    const { user } = renderDataExchange(
      <HistoryFilters mode="export" status="Completed" onStatusChange={onStatusChange} />
    );
    await user.click(screen.getByRole('combobox'));
    const allOption = await screen.findByRole('option', { name: 'All statuses' });
    await user.click(allOption);
    expect(onStatusChange).toHaveBeenCalledWith(undefined);
  });
});
