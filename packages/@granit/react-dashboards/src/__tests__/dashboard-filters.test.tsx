import { act, fireEvent, render, renderHook } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import {
  DashboardFilterProvider,
  useDashboardFilters,
} from '../components/dashboard-filter-context';
import { DashboardFilterToolbar } from '../components/dashboard-filter-toolbar';

import type { DashboardFilter } from '@granit/dashboards';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        'Filter:Customer': 'Customer',
        'Filter:Status': 'Status',
        'Dashboard:Filter.Reset': 'Reset',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(<I18nextProvider i18n={testI18n}>{node}</I18nextProvider>);
}

const customerFilter: DashboardFilter = {
  name: 'Customer',
  labelLocalizationKey: 'Filter:Customer',
  clauses: [{ field: 'customer.id', op: 'Eq', value: '${currentCustomer}' }],
  editable: true,
};

const statusFilter: DashboardFilter = {
  name: 'Status',
  labelLocalizationKey: 'Filter:Status',
  clauses: [{ field: 'status', op: 'Eq', value: 'Open' }],
  editable: true,
};

const silentFilter: DashboardFilter = {
  name: 'CurrentTenant',
  labelLocalizationKey: 'Filter:Tenant',
  clauses: [{ field: 'tenant.id', op: 'Eq', value: '${currentTenant}' }],
  editable: false,
};

describe('DashboardFilterProvider — context state', () => {
  it('seeds values from initialValues and exposes them via useDashboardFilters', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <DashboardFilterProvider
          filters={[customerFilter, statusFilter]}
          initialValues={{ Customer: '42' }}
        >
          {children}
        </DashboardFilterProvider>
      </I18nextProvider>
    );
    const { result } = renderHook(() => useDashboardFilters(), { wrapper });
    expect(result.current?.values).toEqual({ Customer: '42' });
  });

  it('setValue updates the live values map', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <DashboardFilterProvider filters={[customerFilter]}>{children}</DashboardFilterProvider>
      </I18nextProvider>
    );
    const { result } = renderHook(() => useDashboardFilters(), { wrapper });
    expect(result.current?.values).toEqual({});
    act(() => result.current?.setValue('Customer', '99'));
    expect(result.current?.values).toEqual({ Customer: '99' });
  });

  it('setValue with null clears the entry (matches "no filter applied" semantics)', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <DashboardFilterProvider filters={[customerFilter]} initialValues={{ Customer: '42' }}>
          {children}
        </DashboardFilterProvider>
      </I18nextProvider>
    );
    const { result } = renderHook(() => useDashboardFilters(), { wrapper });
    act(() => result.current?.setValue('Customer', null));
    expect(result.current?.values).toEqual({ Customer: null });
  });

  it('resetAll falls back to initialValues', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <DashboardFilterProvider filters={[customerFilter]} initialValues={{ Customer: 'seed' }}>
          {children}
        </DashboardFilterProvider>
      </I18nextProvider>
    );
    const { result } = renderHook(() => useDashboardFilters(), { wrapper });
    act(() => result.current?.setValue('Customer', 'changed'));
    act(() => result.current?.resetAll());
    expect(result.current?.values).toEqual({ Customer: 'seed' });
  });

  it('fires onChange on every value mutation', () => {
    const onChange = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>
        <DashboardFilterProvider filters={[customerFilter]} onChange={onChange}>
          {children}
        </DashboardFilterProvider>
      </I18nextProvider>
    );
    const { result } = renderHook(() => useDashboardFilters(), { wrapper });
    act(() => result.current?.setValue('Customer', '42'));
    expect(onChange).toHaveBeenCalledWith({ Customer: '42' });
  });

  it('useDashboardFilters returns null when called outside the provider', () => {
    const { result } = renderHook(() => useDashboardFilters());
    expect(result.current).toBeNull();
  });
});

describe('<DashboardFilterToolbar />', () => {
  it('renders nothing outside a provider', () => {
    const { container } = wrap(<DashboardFilterToolbar />);
    expect(container.querySelector('[data-slot="dashboard-filter-toolbar"]')).toBeNull();
  });

  it('renders nothing when no filter is editable', () => {
    const { container } = wrap(
      <DashboardFilterProvider filters={[silentFilter]}>
        <DashboardFilterToolbar />
      </DashboardFilterProvider>
    );
    expect(container.querySelector('[data-slot="dashboard-filter-toolbar"]')).toBeNull();
  });

  it('renders one input per editable filter (silent ones skipped)', () => {
    const { container } = wrap(
      <DashboardFilterProvider filters={[customerFilter, statusFilter, silentFilter]}>
        <DashboardFilterToolbar />
      </DashboardFilterProvider>
    );
    const inputs = container.querySelectorAll('[data-slot="dashboard-filter-input"]');
    expect(inputs).toHaveLength(2);
    const names = Array.from(inputs).map((i) => i.getAttribute('data-filter-name'));
    expect(names).toEqual(['Customer', 'Status']);
  });

  it('writes through to the context on change', () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <DashboardFilterProvider filters={[customerFilter]} onChange={onChange}>
        <DashboardFilterToolbar />
      </DashboardFilterProvider>
    );
    const input = container.querySelector('[data-slot="dashboard-filter-input"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: '42' } });
    expect(onChange).toHaveBeenCalledWith({ Customer: '42' });
  });

  it('clearing an input dispatches `null` (drops the filter from the request)', () => {
    const onChange = vi.fn();
    const { container } = wrap(
      <DashboardFilterProvider
        filters={[customerFilter]}
        initialValues={{ Customer: '42' }}
        onChange={onChange}
      >
        <DashboardFilterToolbar />
      </DashboardFilterProvider>
    );
    const input = container.querySelector('[data-slot="dashboard-filter-input"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith({ Customer: null });
  });

  it('Reset button restores initialValues', () => {
    const onChange = vi.fn();
    const { container, getByRole } = wrap(
      <DashboardFilterProvider
        filters={[customerFilter]}
        initialValues={{ Customer: 'seed' }}
        onChange={onChange}
      >
        <DashboardFilterToolbar />
      </DashboardFilterProvider>
    );
    const input = container.querySelector('[data-slot="dashboard-filter-input"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: 'edited' } });
    fireEvent.click(getByRole('button', { name: /reset/i }));
    expect(onChange).toHaveBeenLastCalledWith({ Customer: 'seed' });
  });
});
