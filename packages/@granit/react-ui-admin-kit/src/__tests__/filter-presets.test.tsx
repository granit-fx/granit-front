import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterPresets } from '../querying/filter-presets';

import { renderWithI18n, setupI18n } from './test-utils';

import type { FilterGroupMeta } from '@granit/query-engine';

const groups: FilterGroupMeta[] = [
  {
    name: 'status',
    label: 'Status',
    presets: [
      { name: 'active', label: 'Active', isDefault: false },
      { name: 'archived', label: 'Archived', isDefault: false },
    ],
  },
  {
    name: 'owner',
    label: 'Owner',
    presets: [{ name: 'mine', label: 'Mine', isDefault: false }],
  },
];

beforeAll(setupI18n);

describe('FilterPresets', () => {
  it('renders nothing when there are no groups', () => {
    const { container } = renderWithI18n(
      <FilterPresets groups={[]} activePresets={{}} onToggle={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders group labels and a button per preset', () => {
    renderWithI18n(<FilterPresets groups={groups} activePresets={{}} onToggle={vi.fn()} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archived' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mine' })).toBeInTheDocument();
  });

  it('marks the active preset and uses default variant', () => {
    renderWithI18n(
      <FilterPresets groups={groups} activePresets={{ status: ['active'] }} onToggle={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('button', { name: 'Archived' })).toHaveAttribute(
      'data-active',
      'false'
    );
  });

  it('selects an inactive preset by emitting its name', async () => {
    const onToggle = vi.fn();
    renderWithI18n(<FilterPresets groups={groups} activePresets={{}} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(onToggle).toHaveBeenCalledWith('status', ['active']);
  });

  it('clears an active preset by emitting an empty list', async () => {
    const onToggle = vi.fn();
    renderWithI18n(
      <FilterPresets groups={groups} activePresets={{ status: ['active'] }} onToggle={onToggle} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(onToggle).toHaveBeenCalledWith('status', []);
  });
});
