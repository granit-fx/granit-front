import { screen } from '@testing-library/react';

import { VariableList } from '../components/variable-list';

import { renderWithProviders } from './test-utils';

import type { TemplateVariable } from '@granit/templating';

const globalVars: TemplateVariable[] = [
  { name: 'now', type: 'DateTime', description: 'Current date' },
];
const modelVars: TemplateVariable[] = [{ name: 'model.title', type: 'String', description: null }];

const groups = [
  { label: 'Global', items: globalVars },
  { label: 'Model', items: modelVars },
];

describe('VariableList', () => {
  it('should render variable buttons grouped by label', () => {
    renderWithProviders(
      <VariableList groups={groups} onSelectVariable={vi.fn()} onInsertFunction={vi.fn()} />
    );
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'model.title' })).toBeInTheDocument();
  });

  it('should call onSelectVariable with the variable when clicked', async () => {
    const onSelect = vi.fn();
    const { user } = renderWithProviders(
      <VariableList groups={groups} onSelectVariable={onSelect} onInsertFunction={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'now' }));
    expect(onSelect).toHaveBeenCalledWith(globalVars[0]);
  });

  it('should render the Scriban function shortcuts', () => {
    renderWithProviders(
      <VariableList groups={groups} onSelectVariable={vi.fn()} onInsertFunction={vi.fn()} />
    );
    expect(screen.getByText('Functions')).toBeInTheDocument();
    expect(screen.getByText('if / else')).toBeInTheDocument();
    expect(screen.getByText('for')).toBeInTheDocument();
  });

  it('should call onInsertFunction with the function expression when a function is clicked', async () => {
    const onInsertFunction = vi.fn();
    const { user } = renderWithProviders(
      <VariableList
        groups={groups}
        onSelectVariable={vi.fn()}
        onInsertFunction={onInsertFunction}
      />
    );
    await user.click(screen.getByText('for'));
    expect(onInsertFunction).toHaveBeenCalledWith(
      expect.stringContaining('for item in collection')
    );
  });
});
