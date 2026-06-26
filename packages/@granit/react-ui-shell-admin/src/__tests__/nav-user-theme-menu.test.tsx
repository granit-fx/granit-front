import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@granit/react-ui';
import { COLOR_THEME_CATALOG } from '@granit/ui-theme';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeT } from './test-utils';

import type { ReactElement } from 'react';

vi.mock('@granit/react-localization', () => ({ useTranslation: () => ({ t: makeT() }) }));

vi.mock('next-themes', () => ({ useTheme: () => ({ theme: themeValue, setTheme: setThemeMock }) }));

vi.mock('@granit/react-shell-core', () => ({
  useColorThemeStore: (selector: (s: typeof colorState) => unknown) => selector(colorState),
}));

const setThemeMock = vi.fn();
const setColorThemeMock = vi.fn();
let themeValue = 'system';
// The menu reads the offered themes as ThemeDescriptor[] from the store. Mirror a
// real app: surface the @granit/ui-theme catalogue (includes Blue / Teal / Slate).
const colorState = {
  colorTheme: 'blue',
  setColorTheme: setColorThemeMock,
  themes: COLOR_THEME_CATALOG,
};

const { NavUserThemeMenu } = await import('../nav-user-theme-menu');

function renderOpen(ui: ReactElement) {
  return {
    ...render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>menu</DropdownMenuTrigger>
        <DropdownMenuContent>{ui}</DropdownMenuContent>
      </DropdownMenu>
    ),
    user: userEvent.setup(),
  };
}

beforeEach(() => {
  setThemeMock.mockClear();
  setColorThemeMock.mockClear();
  themeValue = 'system';
  colorState.colorTheme = 'blue';
});

describe('NavUserThemeMenu', () => {
  it('renders the Theme trigger', () => {
    renderOpen(<NavUserThemeMenu />);
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('opens the submenu with every mode and colour option', async () => {
    const { user } = renderOpen(<NavUserThemeMenu />);
    await user.click(screen.getByText('Theme'));

    // Modes (light/dark/system) and the five ui-theme colours render via the maps.
    expect(await screen.findByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Teal')).toBeInTheDocument();
    expect(screen.getByText('Slate')).toBeInTheDocument();
  });

  it('flags the active mode with data-active', async () => {
    themeValue = 'dark';
    const { user } = renderOpen(<NavUserThemeMenu />);
    await user.click(screen.getByText('Theme'));
    await screen.findByText('Dark');
    const actives = [...document.querySelectorAll('[role="menuitem"][data-active="true"]')];
    expect(actives.some((el) => el.textContent?.includes('Dark'))).toBe(true);
  });

  it('flags the active colour with data-active', async () => {
    colorState.colorTheme = 'teal';
    const { user } = renderOpen(<NavUserThemeMenu />);
    await user.click(screen.getByText('Theme'));
    await screen.findByText('Teal');
    const actives = [...document.querySelectorAll('[role="menuitem"][data-active="true"]')];
    expect(actives.some((el) => el.textContent?.includes('Teal'))).toBe(true);
  });
});
