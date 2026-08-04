import { screen, waitFor } from '@testing-library/react';
import * as React from 'react';

import { TemplateCreatePage } from '../components/template-create-page';

import { renderWithProviders } from './test-utils';

import type { TemplateFormValues } from '../validation';

vi.mock('../logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { saveDraft, navigate } = vi.hoisted(() => ({
  saveDraft: { mutateAsync: vi.fn(), isPending: false },
  navigate: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('@granit/react-templating', () => ({
  TemplatingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTemplateMutations: () => ({ saveDraft }),
}));

const formValues: TemplateFormValues = {
  name: 'welcome',
  culture: 'fr',
  layoutName: 'default',
  content: '<h1>Hi</h1>',
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
    <div>
      <button type="button" onClick={() => onSubmit(formValues)}>
        submit
      </button>
      <button type="button" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

describe('TemplateCreatePage handlers', () => {
  beforeEach(() => {
    saveDraft.mutateAsync.mockResolvedValue(undefined);
  });
  afterEach(() => vi.clearAllMocks());

  it('should save the draft and navigate to the detail page on submit', async () => {
    const { toast } = await import('sonner');
    const { user } = renderWithProviders(<TemplateCreatePage />);
    await user.click(screen.getByText('submit'));
    await waitFor(() =>
      expect(saveDraft.mutateAsync).toHaveBeenCalledWith({
        name: 'welcome',
        culture: 'fr',
        content: '<h1>Hi</h1>',
        mimeType: 'text/html',
        layoutName: 'default',
      })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/templating/templates/welcome');
  });

  it('should log and not navigate when save fails', async () => {
    const { logger } = await import('../logger');
    saveDraft.mutateAsync.mockRejectedValueOnce(new Error('fail'));
    const { user } = renderWithProviders(<TemplateCreatePage />);
    await user.click(screen.getByText('submit'));
    await waitFor(() => expect(logger.error).toHaveBeenCalled());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should navigate back to the list on cancel', async () => {
    const { user } = renderWithProviders(<TemplateCreatePage />);
    await user.click(screen.getByText('cancel'));
    expect(navigate).toHaveBeenCalledWith('/templating/templates');
  });
});
