import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityWorkflow } from '../entity-workflow';
import { workflowAdminTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Mock @granit/react-workflow — drive the data hooks directly.
const { mockUseTransitions, mockUseExecuteTransition, mockUseWorkflowHistory } = vi.hoisted(() => ({
  mockUseTransitions: vi.fn(),
  mockUseExecuteTransition: vi.fn(),
  mockUseWorkflowHistory: vi.fn(),
}));

vi.mock('@granit/react-workflow', () => ({
  WorkflowProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useTransitions: mockUseTransitions,
  useExecuteTransition: mockUseExecuteTransition,
  useWorkflowHistory: mockUseWorkflowHistory,
}));

vi.mock('../workflow-status-bar', () => ({
  WorkflowStatusBar: ({
    currentState,
    states,
  }: {
    currentState: string;
    states: readonly string[];
  }) => (
    <div data-testid="workflow-status-bar" data-current-state={currentState}>
      {states.map((s) => (
        <span key={s} data-state={s}>
          {s}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('../workflow-history', () => ({
  WorkflowHistory: ({
    history,
    loading,
    emptyMessage,
  }: {
    history: Array<{ previousState: string; newState: string }>;
    loading?: boolean;
    emptyMessage?: string;
  }) => (
    <div data-testid="workflow-history">
      {loading && <span>Loading…</span>}
      {!loading && history.length === 0 && <span>{emptyMessage}</span>}
      {history.map((entry, i) => (
        <div key={i} data-testid="workflow-history-entry">
          {entry.previousState} → {entry.newState}
        </div>
      ))}
    </div>
  ),
}));

const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...workflowAdminTranslationsEn } } },
  interpolation: { escapeValue: false },
});

function renderWithProviders(ui: ReactElement) {
  return render(<I18nextProvider i18n={testI18n}>{ui}</I18nextProvider>);
}

const defaultTransitionsResult = {
  data: { currentState: 'Active', availableTransitions: [] },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

const defaultExecuteResult = {
  transition: vi.fn().mockResolvedValue(null),
  isPending: false,
  data: null,
  error: null,
};

const defaultHistoryResult = {
  data: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

const states = ['PendingValidation', 'Active', 'Suspended', 'Archived'];

function renderEntityWorkflow() {
  return renderWithProviders(
    <EntityWorkflow
      config={{}}
      entityType="User"
      entityId="u-1"
      currentState="Active"
      states={states}
    />
  );
}

describe('EntityWorkflow', () => {
  afterEach(() => vi.clearAllMocks());

  it('displays the Workflow title', () => {
    mockUseTransitions.mockReturnValue(defaultTransitionsResult);
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue(defaultHistoryResult);
    renderEntityWorkflow();
    expect(screen.getByText('Workflow')).toBeInTheDocument();
  });

  it('displays the spinner during initial loading', () => {
    mockUseTransitions.mockReturnValue({
      ...defaultTransitionsResult,
      data: undefined,
      isLoading: true,
    });
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue(defaultHistoryResult);
    renderEntityWorkflow();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays the error state when loading fails', () => {
    mockUseTransitions.mockReturnValue({
      ...defaultTransitionsResult,
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
    });
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue(defaultHistoryResult);
    renderEntityWorkflow();
    expect(screen.getByText('Failed to load workflow')).toBeInTheDocument();
  });

  it('displays the status bar with the correct current state', () => {
    mockUseTransitions.mockReturnValue({
      ...defaultTransitionsResult,
      data: {
        currentState: 'Active',
        availableTransitions: [
          { targetState: 'Suspended', name: 'Suspend', allowed: true, requiresApproval: false },
        ],
      },
    });
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue(defaultHistoryResult);
    renderEntityWorkflow();
    expect(screen.getByTestId('workflow-status-bar')).toHaveAttribute('data-current-state', 'Active');
  });

  it('displays the empty message when there is no history', () => {
    mockUseTransitions.mockReturnValue(defaultTransitionsResult);
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue(defaultHistoryResult);
    renderEntityWorkflow();
    expect(screen.getByText('No transitions recorded yet.')).toBeInTheDocument();
  });

  it('displays the history entries', () => {
    mockUseTransitions.mockReturnValue(defaultTransitionsResult);
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue({
      ...defaultHistoryResult,
      data: {
        items: [
          {
            previousState: 'PendingValidation',
            newState: 'Active',
            transitionedAt: '2025-12-15T09:35:00Z',
            transitionedBy: 'System Admin',
            comment: null,
          },
        ],
        totalCount: 1,
        hasMore: false,
        nextCursor: null,
      },
    });
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    renderEntityWorkflow();
    expect(screen.getByText('PendingValidation → Active')).toBeInTheDocument();
  });

  it('passes entityType and entityId to the data hooks', () => {
    mockUseTransitions.mockReturnValue(defaultTransitionsResult);
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue(defaultHistoryResult);
    renderEntityWorkflow();
    expect(mockUseTransitions).toHaveBeenCalledWith(
      expect.objectContaining({ currentState: 'Active' })
    );
    expect(mockUseExecuteTransition).toHaveBeenCalledWith(
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(mockUseWorkflowHistory).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'User', entityId: 'u-1' })
    );
  });

  it('sets the data-slot attribute', () => {
    mockUseTransitions.mockReturnValue(defaultTransitionsResult);
    mockUseExecuteTransition.mockReturnValue(defaultExecuteResult);
    mockUseWorkflowHistory.mockReturnValue(defaultHistoryResult);
    renderEntityWorkflow();
    expect(document.querySelector('[data-slot="entity-workflow"]')).toBeInTheDocument();
  });
});
