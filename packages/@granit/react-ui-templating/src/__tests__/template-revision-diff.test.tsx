import { screen, waitFor } from '@testing-library/react';

import { TemplateRevisionDiff } from '../components/template-revision-diff';

import { renderWithProviders } from './test-utils';

import type * as ReactTemplating from '@granit/react-templating';

const { mockUseRevision } = vi.hoisted(() => ({ mockUseRevision: vi.fn() }));

vi.mock('@granit/react-templating', async () => {
  const actual = await vi.importActual<typeof ReactTemplating>('@granit/react-templating');
  return { ...actual, useTemplateRevision: mockUseRevision };
});

describe('TemplateRevisionDiff', () => {
  afterEach(() => vi.clearAllMocks());

  function renderDiff(open = true) {
    return renderWithProviders(
      <TemplateRevisionDiff
        templateName="welcome"
        leftRevisionId="aaaaaaaa1111"
        rightRevisionId="bbbbbbbb2222"
        open={open}
        onOpenChange={vi.fn()}
      />
    );
  }

  it('should show loading skeletons while either side is loading', async () => {
    mockUseRevision
      .mockReturnValueOnce({ data: undefined, isLoading: true })
      .mockReturnValueOnce({ data: undefined, isLoading: false });
    renderDiff();
    await waitFor(() =>
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    );
  });

  it('should render the abbreviated revision ids in the header', async () => {
    mockUseRevision.mockReturnValue({ data: { content: 'same' }, isLoading: false });
    renderDiff();
    await waitFor(() => expect(screen.getByText('aaaaaaaa')).toBeInTheDocument());
    expect(screen.getByText('bbbbbbbb')).toBeInTheDocument();
  });

  it('should render added and removed lines for differing content', async () => {
    mockUseRevision
      .mockReturnValueOnce({ data: { content: 'line one\nline two\n' }, isLoading: false })
      .mockReturnValueOnce({ data: { content: 'line one\nline THREE\n' }, isLoading: false });
    renderDiff();
    await waitFor(() => {
      const container = document.querySelector('[data-slot="template-revision-diff"]');
      expect(container?.textContent).toContain('line THREE');
    });
  });

  it('should show a no-results message when both sides are empty', async () => {
    mockUseRevision.mockReturnValue({ data: { content: '' }, isLoading: false });
    renderDiff();
    await waitFor(() => expect(screen.getByText('No results')).toBeInTheDocument());
  });
});
