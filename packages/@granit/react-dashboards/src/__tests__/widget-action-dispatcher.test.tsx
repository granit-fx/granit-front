import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardAliasProvider } from '../components/dashboard-alias-context.js';
import {
  useWidgetActionDispatcher,
  WidgetActionProvider,
} from '../components/widget-action-context.js';
import { defaultWidgetActionHandlers } from '../lib/default-widget-action-handlers.js';
import {
  composeWidgetActionHandlers,
  type WidgetActionHandler,
} from '../lib/widget-action-handler.js';

import type { WidgetAction } from '@granit/dashboards';
import type { ReactNode } from 'react';

// JSDOM forbids redefining `window.location.assign`, so we test the
// `Navigate` handler via a custom override that records calls — the
// dispatcher's substitution + composition contract is what's
// verified, not the framework default's `window.location.assign`
// invocation (covered by the framework default's own unit test
// scope, where it's mostly an integration concern).

describe('useWidgetActionDispatcher — Navigate handler invocation', () => {
  it('passes the resolved target + params + row through to the registered handler', () => {
    const customNavigate = vi.fn<WidgetActionHandler>();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WidgetActionProvider
        handlers={composeWidgetActionHandlers(defaultWidgetActionHandlers, {
          Navigate: customNavigate,
        })}
      >
        {children}
      </WidgetActionProvider>
    );
    const { result } = renderHook(() => useWidgetActionDispatcher(), { wrapper });
    const action: WidgetAction = {
      trigger: 'RowClick',
      kind: 'Navigate',
      target: '/customers/${row.customerId}',
      params: { status: 'unpaid' },
    };
    result.current(action, { customerId: '42' });
    expect(customNavigate).toHaveBeenCalledOnce();
    const [stampedAction, context] = customNavigate.mock.calls[0]!;
    expect(stampedAction.target).toBe('/customers/42');
    expect(context.params).toEqual({ status: 'unpaid' });
    expect(context.row).toEqual({ customerId: '42' });
  });

  it('substitutes ${aliasName} placeholders from the surrounding DashboardAliasProvider', () => {
    const customNavigate = vi.fn<WidgetActionHandler>();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DashboardAliasProvider values={{ currentCustomer: 'c-7' }}>
        <WidgetActionProvider
          handlers={composeWidgetActionHandlers(defaultWidgetActionHandlers, {
            Navigate: customNavigate,
          })}
        >
          {children}
        </WidgetActionProvider>
      </DashboardAliasProvider>
    );
    const { result } = renderHook(() => useWidgetActionDispatcher(), { wrapper });
    result.current({
      trigger: 'Click',
      kind: 'Navigate',
      target: '/customers/${currentCustomer}',
    });
    expect(customNavigate).toHaveBeenCalledOnce();
    expect(customNavigate.mock.calls[0]?.[0].target).toBe('/customers/c-7');
  });

  it('expands placeholders in `params` against the same context', () => {
    const customNavigate = vi.fn<WidgetActionHandler>();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DashboardAliasProvider values={{ currentTenant: 't-7' }}>
        <WidgetActionProvider
          handlers={composeWidgetActionHandlers(defaultWidgetActionHandlers, {
            Navigate: customNavigate,
          })}
        >
          {children}
        </WidgetActionProvider>
      </DashboardAliasProvider>
    );
    const { result } = renderHook(() => useWidgetActionDispatcher(), { wrapper });
    result.current(
      {
        trigger: 'Click',
        kind: 'Navigate',
        target: '/x',
        params: { tenant: '${currentTenant}', customer: '${row.customerId}' },
      },
      { customerId: '42' }
    );
    expect(customNavigate.mock.calls[0]?.[1].params).toEqual({
      tenant: 't-7',
      customer: '42',
    });
  });
});

describe('useWidgetActionDispatcher — composition fall-through', () => {
  it('falls back to the framework defaults when no provider is mounted', () => {
    const { result } = renderHook(() => useWidgetActionDispatcher());
    // The dispatcher exists and is callable; we don't trigger a real
    // navigation here because JSDOM forbids redefining the location
    // setter — the contract we care about is that the dispatcher
    // resolves and forwards.
    expect(typeof result.current).toBe('function');
  });

  it('app-provided OpenDashboardView handler receives the view setter from the surrounding context', () => {
    const customOpen = vi.fn<WidgetActionHandler>();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WidgetActionProvider
        handlers={composeWidgetActionHandlers(defaultWidgetActionHandlers, {
          OpenDashboardView: customOpen,
        })}
      >
        {children}
      </WidgetActionProvider>
    );
    const { result } = renderHook(() => useWidgetActionDispatcher(), { wrapper });
    result.current({
      trigger: 'Click',
      kind: 'OpenDashboardView',
      target: 'detail',
    });
    expect(customOpen).toHaveBeenCalledOnce();
    // No <DashboardViewProvider> in the tree → setView is null.
    expect(customOpen.mock.calls[0]?.[1].setView).toBeNull();
  });
});

describe('useWidgetActionDispatcher — ExportData / OpenDetail', () => {
  it('ExportData dispatches a custom DOM event apps listen to', () => {
    const listener = vi.fn();
    window.addEventListener('granit:dashboard:export', listener);
    try {
      const { result } = renderHook(() => useWidgetActionDispatcher());
      result.current({
        trigger: 'Click',
        kind: 'ExportData',
        target: 'Granit.Showcase.InvoiceExport',
        params: { range: 'last_30d' },
      });
      expect(listener).toHaveBeenCalledOnce();
      const event = listener.mock.calls[0]?.[0] as CustomEvent;
      expect(event.detail).toMatchObject({
        target: 'Granit.Showcase.InvoiceExport',
        params: { range: 'last_30d' },
      });
    } finally {
      window.removeEventListener('granit:dashboard:export', listener);
    }
  });

  it('OpenDetail dispatches granit:dashboard:open-detail with the row payload', () => {
    const listener = vi.fn();
    window.addEventListener('granit:dashboard:open-detail', listener);
    try {
      const { result } = renderHook(() => useWidgetActionDispatcher());
      result.current(
        { trigger: 'RowClick', kind: 'OpenDetail', target: 'invoice-detail' },
        { invoiceNumber: 'INV-42' }
      );
      expect(listener).toHaveBeenCalledOnce();
      const event = listener.mock.calls[0]?.[0] as CustomEvent;
      expect(event.detail.target).toBe('invoice-detail');
      expect(event.detail.row).toEqual({ invoiceNumber: 'INV-42' });
    } finally {
      window.removeEventListener('granit:dashboard:open-detail', listener);
    }
  });
});
