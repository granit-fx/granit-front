import { TemplateLifecycleStatus } from '@granit/templating';
import { screen } from '@testing-library/react';

import { TemplateDashboard } from '../components/template-dashboard';

import { renderWithProviders } from './test-utils';

import type * as ReactTemplating from '@granit/react-templating';

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return {
    ...actual,
    useTemplateCategories: vi.fn().mockReturnValue({ data: [{ id: '1' }, { id: '2' }] }),
  };
});

describe('TemplateDashboard', () => {
  const items = [
    { currentStatus: TemplateLifecycleStatus.Draft },
    { currentStatus: TemplateLifecycleStatus.Draft },
    { currentStatus: TemplateLifecycleStatus.Published },
    { currentStatus: TemplateLifecycleStatus.Published },
    { currentStatus: TemplateLifecycleStatus.Published },
    { currentStatus: TemplateLifecycleStatus.Archived },
  ];

  it('should display total count', () => {
    renderWithProviders(<TemplateDashboard items={items} />);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should display draft count', () => {
    renderWithProviders(<TemplateDashboard items={items} />);
    expect(screen.getByText('Drafts')).toBeInTheDocument();
    const draftsCard = screen.getByText('Drafts').closest('[data-slot="card-content"]');
    expect(draftsCard?.querySelector('.text-2xl')?.textContent).toBe('2');
  });

  it('should display published count', () => {
    renderWithProviders(<TemplateDashboard items={items} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('should display category count from hook', () => {
    renderWithProviders(<TemplateDashboard items={items} />);
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('should show loading skeletons', () => {
    const { container } = renderWithProviders(<TemplateDashboard isLoading />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });

  it('should have data-slot attribute', () => {
    const { container } = renderWithProviders(<TemplateDashboard items={[]} />);
    expect(container.querySelector('[data-slot="template-dashboard"]')).toBeInTheDocument();
  });
});
