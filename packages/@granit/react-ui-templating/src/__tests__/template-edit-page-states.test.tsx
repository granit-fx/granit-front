import { mockTemplatesData, toTemplateDetail } from '@granit/react-templating/testing';
import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { TemplateEditPage } from '../components/template-edit-page';

import { renderWithProviders } from './test-utils';

import type { TemplateFormValues } from '../validation';
import type { TemplateDetail } from '@granit/templating';

vi.mock('../logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { mockUseTemplate, updateDraft, navigate, mockUseParams } = vi.hoisted(() => ({
  mockUseTemplate: vi.fn(),
  updateDraft: { mutateAsync: vi.fn(), isPending: false },
  navigate: vi.fn(),
  mockUseParams: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => navigate, useParams: () => mockUseParams() };
});

vi.mock('@granit/react-templating', () => ({
  TemplatingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTemplate: (name: string) => mockUseTemplate(name),
  useTemplateMutations: () => ({ updateDraft }),
}));

const formValues: TemplateFormValues = {
  name: 'welcome',
  culture: 'fr',
  layoutName: null,
  content: '<p>x</p>',
  mimeType: 'text/html',
};

vi.mock('../components/template-form', () => ({
  TemplateForm: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (v: TemplateFormValues) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="template-form">
      <button type="button" onClick={() => onSubmit(formValues)}>
        submit
      </button>
      <button type="button" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

vi.mock('../components/template-preview', () => ({
  TemplatePreview: () => <div data-testid="template-preview" />,
}));

vi.mock('../components/template-history', () => ({
  TemplateHistory: ({ onCompare }: { onCompare: (l: string, r: string) => void }) => (
    <button type="button" onClick={() => onCompare('rev-left', 'rev-right')}>
      compare
    </button>
  ),
}));

vi.mock('../components/template-revision-diff', () => ({
  TemplateRevisionDiff: ({ leftRevisionId }: { leftRevisionId: string }) => (
    <div data-testid="diff">{leftRevisionId}</div>
  ),
}));

vi.mock('../components/template-lifecycle-actions', () => ({
  TemplateLifecycleActions: () => <div data-testid="lifecycle" />,
}));

// Email.ResetPassword (index 1) is a Draft → toTemplateDetail gives a draft
// revision and published: null, matching the default state under test.
function detail(overrides: Partial<TemplateDetail> = {}): TemplateDetail {
  return { ...toTemplateDetail(mockTemplatesData[1]!), ...overrides };
}

// Email.Welcome (index 0) has a published version → reuse its published revision
// to exercise the "published, no draft" branch.
const publishedRevision = toTemplateDetail(mockTemplatesData[0]!).published!;

describe('TemplateEditPage states', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ name: 'welcome' });
    mockUseTemplate.mockReturnValue({ data: detail(), isLoading: false });
    updateDraft.mutateAsync.mockResolvedValue(undefined);
  });
  afterEach(() => vi.clearAllMocks());

  it('should render null when there is no name param', () => {
    mockUseParams.mockReturnValue({ name: undefined });
    const { container } = renderWithProviders(<TemplateEditPage />);
    expect(container.querySelector('[data-slot="template-edit-page"]')).not.toBeInTheDocument();
  });

  it('should render loading skeletons while loading', () => {
    mockUseTemplate.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithProviders(<TemplateEditPage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('should render a not-found state when the template is missing', () => {
    mockUseTemplate.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<TemplateEditPage />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('should render the tabs and lifecycle actions', () => {
    renderWithProviders(<TemplateEditPage />);
    expect(screen.getByRole('tab', { name: 'Template Editor' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Revision History' })).toBeInTheDocument();
    expect(screen.getByTestId('lifecycle')).toBeInTheDocument();
  });

  it('should update the draft and toast on submit', async () => {
    const { toast } = await import('sonner');
    const { user } = renderWithProviders(<TemplateEditPage />);
    await user.click(screen.getByText('submit'));
    await waitFor(() =>
      expect(updateDraft.mutateAsync).toHaveBeenCalledWith({
        name: 'welcome',
        request: expect.objectContaining({ content: '<p>x</p>', mimeType: 'text/html' }),
      })
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('should log when the update fails', async () => {
    const { logger } = await import('../logger');
    updateDraft.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<TemplateEditPage />);
    await user.click(screen.getByText('submit'));
    await waitFor(() => expect(logger.error).toHaveBeenCalled());
  });

  it('should navigate to the list on cancel', async () => {
    const { user } = renderWithProviders(<TemplateEditPage />);
    await user.click(screen.getByText('cancel'));
    expect(navigate).toHaveBeenCalledWith('/templating/templates');
  });

  it('should open the diff dialog when history triggers a compare', async () => {
    const { user } = renderWithProviders(<TemplateEditPage />);
    await user.click(screen.getByRole('tab', { name: 'Revision History' }));
    await user.click(await screen.findByText('compare'));
    expect(await screen.findByTestId('diff')).toHaveTextContent('rev-left');
  });

  it('should use the published revision content when there is no draft', () => {
    mockUseTemplate.mockReturnValue({
      data: detail({ draft: null, published: publishedRevision }),
      isLoading: false,
    });
    renderWithProviders(<TemplateEditPage />);
    expect(screen.getByTestId('template-form')).toBeInTheDocument();
  });
});
