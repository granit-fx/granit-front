import { render, screen } from '@testing-library/react';

import { ThemeProvider } from '../theme-provider';

// next-themes (enableSystem) reads window.matchMedia, which jsdom declares but
// does not implement — provide a minimal stub.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe('ThemeProvider', () => {
  it('renders its children', () => {
    render(
      <ThemeProvider>
        <span>themed</span>
      </ThemeProvider>
    );
    expect(screen.getByText('themed')).toBeInTheDocument();
  });

  it('accepts a custom default theme without throwing', () => {
    expect(() =>
      render(
        <ThemeProvider defaultTheme="dark">
          <span>dark-themed</span>
        </ThemeProvider>
      )
    ).not.toThrow();
    expect(screen.getByText('dark-themed')).toBeInTheDocument();
  });
});
