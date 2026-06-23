import { screen } from '@testing-library/react';

import { FilterPanel } from '../components/filter-panel';

import { renderWithProviders } from './test-utils';

import type { TemplateVariable } from '@granit/templating';

const dateVar: TemplateVariable = { name: 'createdAt', type: 'DateTime', description: null };
const boolVar: TemplateVariable = { name: 'active', type: 'Boolean', description: null };

describe('FilterPanel', () => {
  it('should render the variable name, type and raw-insert option', () => {
    renderWithProviders(
      <FilterPanel
        variable={dateVar}
        onInsertRaw={vi.fn()}
        onInsertWithFilter={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText('createdAt')).toBeInTheDocument();
    expect(screen.getByText('DateTime')).toBeInTheDocument();
    expect(screen.getByText('{{ createdAt }}')).toBeInTheDocument();
    expect(screen.getByText('No filter')).toBeInTheDocument();
  });

  it('should render type-specific filters', () => {
    renderWithProviders(
      <FilterPanel
        variable={dateVar}
        onInsertRaw={vi.fn()}
        onInsertWithFilter={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('dd/MM/yyyy')).toBeInTheDocument();
  });

  it('should call onBack when the back button is clicked', async () => {
    const onBack = vi.fn();
    const { user } = renderWithProviders(
      <FilterPanel
        variable={dateVar}
        onInsertRaw={vi.fn()}
        onInsertWithFilter={vi.fn()}
        onBack={onBack}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('should call onInsertRaw when the raw option is clicked', async () => {
    const onInsertRaw = vi.fn();
    const { user } = renderWithProviders(
      <FilterPanel
        variable={dateVar}
        onInsertRaw={onInsertRaw}
        onInsertWithFilter={vi.fn()}
        onBack={vi.fn()}
      />
    );
    await user.click(screen.getByText('{{ createdAt }}'));
    expect(onInsertRaw).toHaveBeenCalled();
  });

  it('should call onInsertWithFilter with the computed expression', async () => {
    const onInsertWithFilter = vi.fn();
    const { user } = renderWithProviders(
      <FilterPanel
        variable={dateVar}
        onInsertRaw={vi.fn()}
        onInsertWithFilter={onInsertWithFilter}
        onBack={vi.fn()}
      />
    );
    await user.click(screen.getByText('dd/MM/yyyy'));
    expect(onInsertWithFilter).toHaveBeenCalledWith('{{ createdAt | date.to_string "%d/%m/%Y" }}');
  });

  it('should still render the raw option for boolean variables', () => {
    renderWithProviders(
      <FilterPanel
        variable={boolVar}
        onInsertRaw={vi.fn()}
        onInsertWithFilter={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText('{{ active }}')).toBeInTheDocument();
    expect(screen.getByText('if/else')).toBeInTheDocument();
  });
});
