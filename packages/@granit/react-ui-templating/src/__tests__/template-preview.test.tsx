import { fireEvent, screen, waitFor } from '@testing-library/react';

import { TemplatePreview } from '../components/template-preview';

import { renderWithProviders } from './test-utils';

import type * as ReactTemplating from '@granit/react-templating';
import type { TemplateVariables } from '@granit/templating';

vi.mock('../logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const { mockHtmlPreview, mockBinaryPreview, mockUseVariables } = vi.hoisted(() => ({
  mockHtmlPreview: vi.fn(),
  mockBinaryPreview: vi.fn(),
  mockUseVariables: vi.fn(),
}));

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return {
    ...actual,
    useTemplatePreview: () => mockHtmlPreview(),
    useTemplateBinaryPreview: () => mockBinaryPreview(),
    useTemplateVariables: mockUseVariables,
  };
});

const variables: TemplateVariables = {
  globalVariables: [{ name: 'now', type: 'DateTime', description: null }],
  modelVariables: [
    { name: 'amount', type: 'Decimal', description: null },
    { name: 'count', type: 'Int32', description: null },
    { name: 'active', type: 'Boolean', description: null },
    { name: 'email', type: 'String', description: null },
    { name: 'plain', type: 'String', description: null },
  ],
  enrichedVariables: [],
};

function htmlState(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    data: undefined,
    error: undefined,
    ...overrides,
  };
}
function binaryState(overrides: Record<string, unknown> = {}) {
  return { mutate: vi.fn(), isPending: false, ...overrides };
}

describe('TemplatePreview', () => {
  beforeEach(() => {
    localStorage.clear();
    mockHtmlPreview.mockReturnValue(htmlState());
    mockBinaryPreview.mockReturnValue(binaryState());
    mockUseVariables.mockReturnValue({ data: variables });
  });
  afterEach(() => vi.clearAllMocks());

  it('should render the test-data and preview panels', () => {
    renderWithProviders(<TemplatePreview templateName="welcome" />);
    expect(document.querySelector('[data-slot="template-preview"]')).toBeInTheDocument();
    expect(screen.getAllByText('Test Data').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
  });

  it('should offer a generate-sample button when variables are present', () => {
    renderWithProviders(<TemplatePreview templateName="welcome" />);
    expect(screen.getByRole('button', { name: /Generate Sample/ })).toBeInTheDocument();
  });

  it('should not offer generate-sample when there are no variables', () => {
    mockUseVariables.mockReturnValue({ data: undefined });
    renderWithProviders(<TemplatePreview templateName="welcome" />);
    expect(screen.queryByRole('button', { name: /Generate Sample/ })).not.toBeInTheDocument();
  });

  it('should generate sample test data for all variable types', async () => {
    const { user } = renderWithProviders(<TemplatePreview templateName="welcome" />);
    await user.click(screen.getByRole('button', { name: /Generate Sample/ }));
    await waitFor(() => {
      const editor = document.querySelector('textarea');
      expect(editor?.value).toContain('"amount"');
      expect(editor?.value).toContain('"active": true');
    });
  });

  it('should call the html preview mutation with parsed data', async () => {
    const mutate = vi.fn();
    mockHtmlPreview.mockReturnValue(htmlState({ mutate }));
    const { user } = renderWithProviders(<TemplatePreview templateName="welcome" culture="fr" />);
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(mutate).toHaveBeenCalledWith({
      name: 'welcome',
      request: { culture: 'fr', data: {} },
    });
  });

  it('should not call preview when the test data is invalid JSON', async () => {
    const mutate = vi.fn();
    mockHtmlPreview.mockReturnValue(htmlState({ mutate }));
    const { user } = renderWithProviders(<TemplatePreview templateName="welcome" />);
    const editor = document.querySelector('textarea')!;
    await user.clear(editor);
    fireEvent.change(editor, { target: { value: '{not json' } });
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('should render the html result in an iframe', () => {
    mockHtmlPreview.mockReturnValue(
      htmlState({ data: { html: '<p>Rendered</p>', renderTimeMs: 12, revisionId: null } })
    );
    renderWithProviders(<TemplatePreview templateName="welcome" />);
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.getAttribute('srcdoc')).toContain('Rendered');
    expect(screen.getByText(/12ms/)).toBeInTheDocument();
  });

  it('should render an error message when preview fails', () => {
    mockHtmlPreview.mockReturnValue(
      htmlState({ isError: true, error: { message: 'Scriban parse error' } })
    );
    renderWithProviders(<TemplatePreview templateName="welcome" />);
    expect(screen.getByText('Preview error')).toBeInTheDocument();
    expect(screen.getByText('Scriban parse error')).toBeInTheDocument();
  });

  it('should disable the preview button while pending', () => {
    mockHtmlPreview.mockReturnValue(htmlState({ isPending: true }));
    renderWithProviders(<TemplatePreview templateName="welcome" />);
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
  });

  it('should trigger a binary download when a non-html format is selected', async () => {
    const binaryMutate = vi.fn((_vars, opts: { onSuccess: (blob: Blob) => void }) => {
      opts.onSuccess(new Blob(['pdf-bytes']));
    });
    mockBinaryPreview.mockReturnValue(binaryState({ mutate: binaryMutate }));

    const createObjectURL = vi.fn().mockReturnValue('blob:fake');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    const { user } = renderWithProviders(<TemplatePreview templateName="welcome" />);
    await user.click(screen.getAllByRole('combobox')[0]!);
    await user.click(await screen.findByText('PDF'));
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(binaryMutate).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
