import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ShellChromeProvider,
  useShellChrome,
  type ShellChromeValue,
} from '../shell-chrome-context';

import type { ReactNode } from 'react';

const value: ShellChromeValue = {
  appKind: 'host',
  navModel: { mainNavigation: [], navGroups: [] },
  appVersion: '9.9.9',
};

describe('ShellChromeProvider / useShellChrome', () => {
  it('provides the chrome value to consumers', () => {
    const { result } = renderHook(() => useShellChrome(), {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <ShellChromeProvider value={value}>{children}</ShellChromeProvider>
      ),
    });
    expect(result.current.appKind).toBe('host');
    expect(result.current.appVersion).toBe('9.9.9');
  });

  it('renders children inside the provider', () => {
    render(
      <ShellChromeProvider value={value}>
        <span>chrome-child</span>
      </ShellChromeProvider>
    );
    expect(screen.getByText('chrome-child')).toBeInTheDocument();
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useShellChrome())).toThrow(/ShellChromeProvider/);
  });
});
