import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  buildWorkflowQueryKey,
  useWorkflowConfig,
  WorkflowProvider,
} from '../providers/workflow-provider.js';

import { createMockClient } from './test-utils.tsx';

describe('WorkflowProvider', () => {
  it('should provide config to children', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useWorkflowConfig(), {
      wrapper: ({ children }) => (
        <WorkflowProvider config={{ client, basePath: '/api/wf' }}>
          {children}
        </WorkflowProvider>
      ),
    });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/wf');
  });

  it('should use default basePath', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useWorkflowConfig(), {
      wrapper: ({ children }) => (
        <WorkflowProvider config={{ client }}>{children}</WorkflowProvider>
      ),
    });

    expect(result.current.basePath).toBe('/api/v1/workflow');
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useWorkflowConfig());
    }).toThrow('useWorkflowConfig must be used within a <WorkflowProvider>');
  });

  it('should render children', () => {
    const client = createMockClient();

    render(
      <WorkflowProvider config={{ client }}>
        <div data-testid="child">Hello</div>
      </WorkflowProvider>,
    );

    expect(screen.getByTestId('child')).toBeTruthy();
  });
});

describe('buildWorkflowQueryKey', () => {
  it('should use default prefix', () => {
    const client = createMockClient();
    const key = buildWorkflowQueryKey({ client }, 'transitions', 'Draft');
    expect(key).toEqual(['workflow', 'transitions', 'Draft']);
  });

  it('should use custom prefix', () => {
    const client = createMockClient();
    const key = buildWorkflowQueryKey(
      { client, queryKeyPrefix: ['custom', 'wf'] },
      'history',
    );
    expect(key).toEqual(['custom', 'wf', 'history']);
  });
});
