import { screen } from '@testing-library/react';

import { VariablePanel } from '../components/variable-panel';

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
  enrichedVariables: [{ name: 'tenant', type: 'String', description: null }],
};

describe('VariablePanel', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render loading skeletons while loading', () => {
    mockUseTemplateVariables.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithProviders(
      <VariablePanel templateName="welcome" onInsert={vi.fn()} />
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('should render nothing when there are no variables', () => {
    mockUseTemplateVariables.mockReturnValue({ data: undefined, isLoading: false });
    const { container } = renderWithProviders(
      <VariablePanel templateName="welcome" onInsert={vi.fn()} />
    );
    expect(container.querySelector('[data-slot="variable-panel"]')).not.toBeInTheDocument();
  });

  it('should render the three variable groups', () => {
    mockUseTemplateVariables.mockReturnValue({ data: variables, isLoading: false });
    renderWithProviders(<VariablePanel templateName="welcome" onInsert={vi.fn()} />);
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Enrichment')).toBeInTheDocument();
    expect(screen.getByText('Available Variables')).toBeInTheDocument();
  });

  it('should insert a variable wrapped in scriban braces when clicked', async () => {
    mockUseTemplateVariables.mockReturnValue({ data: variables, isLoading: false });
    const onInsert = vi.fn();
    const { user } = renderWithProviders(
      <VariablePanel templateName="welcome" onInsert={onInsert} />
    );
    await user.click(screen.getByRole('button', { name: 'now' }));
    expect(onInsert).toHaveBeenCalledWith('{{ now }}');
  });

  it('should omit empty groups', () => {
    mockUseTemplateVariables.mockReturnValue({
      data: {
        globalVariables: variables.globalVariables,
        modelVariables: [],
        enrichedVariables: [],
      },
      isLoading: false,
    });
    renderWithProviders(<VariablePanel templateName="welcome" onInsert={vi.fn()} />);
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.queryByText('Model')).not.toBeInTheDocument();
    expect(screen.queryByText('Enrichment')).not.toBeInTheDocument();
  });
});
