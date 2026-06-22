import { renderHook } from '@testing-library/react';
import i18next from 'i18next';
import { type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { useOperatorLabels } from '../hooks/use-operator-labels';
import { useSmartFilterSync } from '../hooks/use-smart-filter-sync';

import { setupI18n } from './test-utils';

beforeAll(setupI18n);

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}

describe('useOperatorLabels', () => {
  it('exposes a label for every operator (keyed off the i18n bundle)', () => {
    const { result } = renderHook(() => useOperatorLabels(), { wrapper });
    // With no resources, i18next echoes the key — proves each operator is wired.
    expect(result.current.Eq).toBe('Operators.Eq');
    expect(result.current.Between).toBe('Operators.Between');
    expect(Object.keys(result.current)).toHaveLength(10);
  });
});

describe('useSmartFilterSync', () => {
  const makeEndpoint = () => ({
    setFilters: vi.fn(),
    setSearch: vi.fn(),
    setPresets: vi.fn(),
    setQuickFilters: vi.fn(),
  });

  it('pushes filters (with base filters prepended), search and quick filters to the endpoint', () => {
    const endpoint = makeEndpoint();
    const smartFilter = {
      filters: [{ field: 'name' }],
      search: 'abc',
      presets: {},
      quickFilters: ['active'],
      tokens: [],
      removeToken: vi.fn(),
      addPresetToken: vi.fn(),
    };
    const base = [{ field: 'siteId' }];
    renderHook(
      () =>
        useSmartFilterSync(
          smartFilter as never,
          endpoint as never,
          { data: undefined } as never,
          base as never
        ),
      { wrapper }
    );
    expect(endpoint.setFilters).toHaveBeenCalledWith([{ field: 'siteId' }, { field: 'name' }]);
    expect(endpoint.setSearch).toHaveBeenCalledWith('abc');
    expect(endpoint.setQuickFilters).toHaveBeenCalledWith(['active']);
  });

  it('handlePresetToggle removes matching preset tokens when the selection clears', () => {
    const endpoint = makeEndpoint();
    const removeToken = vi.fn();
    const smartFilter = {
      filters: [],
      search: '',
      presets: {},
      quickFilters: [],
      tokens: [{ id: 't1', type: 'preset', group: 'status' }],
      removeToken,
      addPresetToken: vi.fn(),
    };
    const { result } = renderHook(
      () =>
        useSmartFilterSync(smartFilter as never, endpoint as never, { data: undefined } as never),
      { wrapper }
    );
    result.current.handlePresetToggle('status', []);
    expect(removeToken).toHaveBeenCalledWith('t1');
  });

  it('handlePresetToggle adds a preset token when a named preset is selected', () => {
    const endpoint = makeEndpoint();
    const addPresetToken = vi.fn();
    const smartFilter = {
      filters: [],
      search: '',
      presets: {},
      quickFilters: [],
      tokens: [],
      removeToken: vi.fn(),
      addPresetToken,
    };
    const meta = {
      data: {
        presetFilterGroups: [{ name: 'status', presets: [{ name: 'open', label: 'Open' }] }],
      },
    };
    const { result } = renderHook(
      () => useSmartFilterSync(smartFilter as never, endpoint as never, meta as never),
      { wrapper }
    );
    result.current.handlePresetToggle('status', ['open']);
    expect(addPresetToken).toHaveBeenCalledWith('status', 'open', 'Open');
  });
});
