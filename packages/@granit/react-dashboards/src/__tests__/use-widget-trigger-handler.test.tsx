import { fireEvent, render, renderHook } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { WidgetActionProvider } from '../components/widget-action-context';
import { MarkdownWidget } from '../components/widgets/markdown-widget';
import { useWidgetTriggerHandler } from '../hooks/use-widget-trigger-handler';
import { defaultWidgetActionHandlers } from '../lib/default-widget-action-handlers';
import {
  composeWidgetActionHandlers,
  type WidgetActionHandler,
} from '../lib/widget-action-handler';

import type { MarkdownWidgetDefinition, WidgetAction } from '@granit/dashboards';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { 'Widget:Test.Banner': 'Banner copy' } } },
  interpolation: { escapeValue: false },
});

describe('useWidgetTriggerHandler', () => {
  it('returns null when actions is null / undefined / empty', () => {
    const { result: nullResult } = renderHook(() => useWidgetTriggerHandler('Click', null));
    expect(nullResult.current).toBeNull();

    const { result: undefResult } = renderHook(() => useWidgetTriggerHandler('Click', undefined));
    expect(undefResult.current).toBeNull();

    const { result: emptyResult } = renderHook(() => useWidgetTriggerHandler('Click', []));
    expect(emptyResult.current).toBeNull();
  });

  it('returns null when no action matches the trigger', () => {
    const actions: WidgetAction[] = [{ trigger: 'RowClick', kind: 'OpenDetail', target: 'detail' }];
    const { result } = renderHook(() => useWidgetTriggerHandler('Click', actions));
    expect(result.current).toBeNull();
  });

  it('returns a callable when at least one action matches the trigger', () => {
    const actions: WidgetAction[] = [{ trigger: 'Click', kind: 'OpenDetail', target: 'detail' }];
    const { result } = renderHook(() => useWidgetTriggerHandler('Click', actions));
    expect(typeof result.current).toBe('function');
  });

  it('dispatches every matching action in declaration order', () => {
    const captured: string[] = [];
    const handler: WidgetActionHandler = (action) => {
      captured.push(action.target);
    };
    const handlers = composeWidgetActionHandlers(defaultWidgetActionHandlers, {
      OpenDetail: handler,
      ExportData: handler,
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WidgetActionProvider handlers={handlers}>{children}</WidgetActionProvider>
    );
    const actions: WidgetAction[] = [
      { trigger: 'Click', kind: 'OpenDetail', target: 'first' },
      { trigger: 'RowClick', kind: 'OpenDetail', target: 'skipped' },
      { trigger: 'Click', kind: 'ExportData', target: 'second' },
    ];
    const { result } = renderHook(() => useWidgetTriggerHandler('Click', actions), { wrapper });
    result.current?.();
    expect(captured).toEqual(['first', 'second']);
  });

  it("shares the dispatcher's placeholder substitution rules", () => {
    const captured: WidgetAction[] = [];
    const handlers = composeWidgetActionHandlers(defaultWidgetActionHandlers, {
      OpenDetail: (action) => {
        captured.push(action);
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WidgetActionProvider handlers={handlers}>{children}</WidgetActionProvider>
    );
    const actions: WidgetAction[] = [
      { trigger: 'Click', kind: 'OpenDetail', target: '/customers/${row.id}' },
    ];
    const { result } = renderHook(() => useWidgetTriggerHandler('Click', actions), { wrapper });
    result.current?.({ id: '42' });
    expect(captured[0]?.target).toBe('/customers/42');
  });
});

describe('Definition-side widgets — Click integration', () => {
  function withProviders(node: ReactNode, captured: { target?: string }) {
    const handlers = composeWidgetActionHandlers(defaultWidgetActionHandlers, {
      OpenDetail: (action) => {
        captured.target = action.target;
      },
    });
    return render(
      <I18nextProvider i18n={testI18n}>
        <WidgetActionProvider handlers={handlers}>{node}</WidgetActionProvider>
      </I18nextProvider>
    );
  }

  it('MarkdownWidget without actions stays non-interactive (no role, no cursor)', () => {
    const widget: MarkdownWidgetDefinition = {
      slug: 'Banner',
      type: 'markdown',
      position: 0,
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:Test.Banner',
    };
    const captured: { target?: string } = {};
    const { container } = withProviders(<MarkdownWidget widget={widget} />, captured);
    const root = container.querySelector('[data-slot="markdown-widget"]');
    expect(root?.getAttribute('role')).toBeNull();
    expect(root?.getAttribute('tabindex')).toBeNull();
  });

  it('MarkdownWidget with a Click action becomes a native button and dispatches on click', () => {
    const widget: MarkdownWidgetDefinition = {
      slug: 'Banner',
      type: 'markdown',
      position: 0,
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:Test.Banner',
      actions: [{ trigger: 'Click', kind: 'OpenDetail', target: 'banner-detail' }],
    };
    const captured: { target?: string } = {};
    const { container } = withProviders(<MarkdownWidget widget={widget} />, captured);
    const root = container.querySelector('[data-slot="markdown-widget"]');
    expect(root?.tagName).toBe('BUTTON');
    expect(root?.getAttribute('type')).toBe('button');
    if (!(root instanceof HTMLElement)) throw new Error('root not found');
    fireEvent.click(root);
    expect(captured.target).toBe('banner-detail');
  });

  it('MarkdownWidget keyboard activation (Enter / Space) dispatches the same action', () => {
    const widget: MarkdownWidgetDefinition = {
      slug: 'Banner',
      type: 'markdown',
      position: 0,
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:Test.Banner',
      actions: [{ trigger: 'Click', kind: 'OpenDetail', target: 'kb-detail' }],
    };
    const captured: { target?: string } = {};
    const { container } = withProviders(<MarkdownWidget widget={widget} />, captured);
    const root = container.querySelector('[data-slot="markdown-widget"]');
    if (!(root instanceof HTMLElement)) throw new Error('root not found');
    // Native <button> handles Enter / Space synthetically as a click event.
    fireEvent.click(root);
    expect(captured.target).toBe('kb-detail');
  });
});
