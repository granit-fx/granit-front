import { screen, waitFor } from '@testing-library/react';

import { InsertVariableButton } from '../components/insert-variable-button';

import { renderWithProviders } from './test-utils';

import type * as ReactTemplating from '@granit/react-templating';
import type { TemplateVariables } from '@granit/templating';

const { mockUseTemplateVariables } = vi.hoisted(() => ({ mockUseTemplateVariables: vi.fn() }));

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return { ...actual, useTemplateVariables: mockUseTemplateVariables };
});

const variables: TemplateVariables = {
  globalVariables: [{ name: 'now', type: 'DateTime', description: 'Current date' }],
  modelVariables: [{ name: 'title', type: 'String', description: null }],
  enrichedVariables: [],
};

describe('InsertVariableButton', () => {
  beforeEach(() => {
    mockUseTemplateVariables.mockReturnValue({ data: variables });
  });
  afterEach(() => vi.clearAllMocks());

  it('should render the trigger button', () => {
    renderWithProviders(<InsertVariableButton templateName="welcome" onInsert={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Insert Variable' })).toBeInTheDocument();
  });

  it('should open the popover and list the variable groups', async () => {
    const { user } = renderWithProviders(
      <InsertVariableButton templateName="welcome" onInsert={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Insert Variable' }));
    await waitFor(() => expect(screen.getByText('Global')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'now' })).toBeInTheDocument();
  });

  it('should drill into the filter panel and insert a filtered expression', async () => {
    const onInsert = vi.fn();
    const { user } = renderWithProviders(
      <InsertVariableButton templateName="welcome" onInsert={onInsert} />
    );
    await user.click(screen.getByRole('button', { name: 'Insert Variable' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'now' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'now' }));
    // FilterPanel now shown
    await waitFor(() => expect(screen.getByText('No filter')).toBeInTheDocument());
    await user.click(screen.getByText('dd/MM/yyyy'));
    expect(onInsert).toHaveBeenCalledWith('{{ now | date.to_string "%d/%m/%Y" }}');
  });

  it('should insert the raw variable via the filter panel raw option', async () => {
    const onInsert = vi.fn();
    const { user } = renderWithProviders(
      <InsertVariableButton templateName="welcome" onInsert={onInsert} />
    );
    await user.click(screen.getByRole('button', { name: 'Insert Variable' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'now' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'now' }));
    await waitFor(() => expect(screen.getByText('{{ now }}')).toBeInTheDocument());
    await user.click(screen.getByText('{{ now }}'));
    expect(onInsert).toHaveBeenCalledWith('{{ now }}');
  });

  it('should go back from the filter panel to the variable list', async () => {
    const { user } = renderWithProviders(
      <InsertVariableButton templateName="welcome" onInsert={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Insert Variable' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'now' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'now' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByText('Functions')).toBeInTheDocument());
  });

  it('should insert a function expression from the variable list', async () => {
    const onInsert = vi.fn();
    const { user } = renderWithProviders(
      <InsertVariableButton templateName="welcome" onInsert={onInsert} />
    );
    await user.click(screen.getByRole('button', { name: 'Insert Variable' }));
    await waitFor(() => expect(screen.getByText('for')).toBeInTheDocument());
    await user.click(screen.getByText('for'));
    expect(onInsert).toHaveBeenCalledWith(expect.stringContaining('for item in collection'));
  });

  it('should handle empty variables without crashing', async () => {
    mockUseTemplateVariables.mockReturnValue({ data: undefined });
    const { user } = renderWithProviders(
      <InsertVariableButton templateName="welcome" onInsert={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: 'Insert Variable' }));
    await waitFor(() => expect(screen.getByText('Functions')).toBeInTheDocument());
  });
});
