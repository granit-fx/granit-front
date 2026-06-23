import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from '../sidebar.js';

function stubMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }),
  });
}

function renderInProvider(
  ui: React.ReactNode,
  props?: React.ComponentProps<typeof SidebarProvider>
) {
  return render(<SidebarProvider {...props}>{ui}</SidebarProvider>);
}

describe('Sidebar layout components', () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  it('renders the desktop sidebar with explicit variant/side/collapsible attributes', () => {
    renderInProvider(
      <Sidebar variant="floating" side="right" collapsible="icon">
        <SidebarContent data-testid="content">Body</SidebarContent>
      </Sidebar>
    );

    const inner = screen.getByText('Body').closest('[data-slot="sidebar"]');
    expect(inner).toHaveAttribute('data-variant', 'floating');
    expect(inner).toHaveAttribute('data-side', 'right');
  });

  it('renders a non-collapsible sidebar as a plain container', () => {
    renderInProvider(
      <Sidebar collapsible="none">
        <span>Static</span>
      </Sidebar>
    );

    expect(screen.getByText('Static')).toBeInTheDocument();
    const root = screen.getByText('Static').closest('[data-slot="sidebar"]');
    expect(root).not.toHaveAttribute('data-variant');
  });

  it('renders the inset variant gap for the desktop branch', () => {
    renderInProvider(
      <Sidebar variant="inset">
        <SidebarContent>Inset body</SidebarContent>
      </Sidebar>
    );
    expect(screen.getByText('Inset body')).toBeInTheDocument();
  });

  it('renders inside a Sheet (no desktop container) on a mobile viewport', () => {
    stubMatchMedia(true);
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    renderInProvider(
      <Sidebar>
        <SidebarContent>Mobile body</SidebarContent>
      </Sidebar>
    );

    // On mobile the desktop container (the only element carrying data-state) is
    // never rendered; the content lives in a closed Sheet portal instead.
    expect(document.querySelector('[data-slot="sidebar"][data-state]')).toBeNull();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  it('renders header/footer/separator/input/inset/group slots', () => {
    renderInProvider(
      <>
        <Sidebar>
          <SidebarHeader data-testid="header">H</SidebarHeader>
          <SidebarInput placeholder="Filter" />
          <SidebarSeparator data-testid="sep" />
          <SidebarGroup data-testid="group">
            <SidebarGroupLabel>Label</SidebarGroupLabel>
            <SidebarGroupAction aria-label="add">+</SidebarGroupAction>
            <SidebarGroupContent data-testid="group-content">GC</SidebarGroupContent>
          </SidebarGroup>
          <SidebarFooter data-testid="footer">F</SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset data-testid="inset">Main</SidebarInset>
      </>
    );

    expect(screen.getByTestId('header')).toHaveAttribute('data-sidebar', 'header');
    expect(screen.getByPlaceholderText('Filter')).toHaveAttribute('data-sidebar', 'input');
    expect(screen.getByTestId('sep')).toHaveAttribute('data-sidebar', 'separator');
    expect(screen.getByText('Label')).toHaveAttribute('data-sidebar', 'group-label');
    expect(screen.getByTestId('group-content')).toHaveAttribute('data-sidebar', 'group-content');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-sidebar', 'footer');
    expect(screen.getByTestId('inset')).toHaveAttribute('data-slot', 'sidebar-inset');
  });

  it('renders group label and group action as slotted children when asChild', () => {
    renderInProvider(
      <Sidebar>
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <h2>Slotted label</h2>
          </SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <a href="/add">Slotted action</a>
          </SidebarGroupAction>
        </SidebarGroup>
      </Sidebar>
    );

    expect(screen.getByRole('heading', { name: 'Slotted label' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Slotted action' })).toBeInTheDocument();
  });

  it('SidebarRail toggles the sidebar', async () => {
    const user = userEvent.setup();
    renderInProvider(
      <Sidebar>
        <SidebarRail />
      </Sidebar>
    );

    const rail = screen.getByRole('button', { name: 'Toggle Sidebar' });
    const sidebar = rail.closest('[data-state]');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');

    await user.click(rail);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });
});

describe('Sidebar menu components', () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  it('renders a menu with items, actions, badges and a plain button', () => {
    renderInProvider(
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>Dashboard</SidebarMenuButton>
          <SidebarMenuAction aria-label="more">…</SidebarMenuAction>
          <SidebarMenuBadge data-testid="badge">9</SidebarMenuBadge>
        </SidebarMenuItem>
      </SidebarMenu>
    );

    expect(screen.getByText('Dashboard')).toHaveAttribute('data-sidebar', 'menu-button');
    expect(screen.getByLabelText('more')).toHaveAttribute('data-sidebar', 'menu-action');
    expect(screen.getByTestId('badge')).toHaveAttribute('data-sidebar', 'menu-badge');
  });

  it('honours menu button variants, sizes and active state', () => {
    renderInProvider(
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton variant="outline" size="lg" isActive>
            Active
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );

    const button = screen.getByText('Active');
    expect(button).toHaveAttribute('data-active', 'true');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('renders the menu button as a slotted child when asChild', () => {
    renderInProvider(
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href="/home">Home link</a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );

    expect(screen.getByRole('link', { name: 'Home link' })).toHaveAttribute(
      'data-sidebar',
      'menu-button'
    );
  });

  it('wraps the button in a tooltip when a string tooltip is supplied', () => {
    renderInProvider(
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Helpful">Item</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );

    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('accepts an object tooltip configuration', () => {
    renderInProvider(
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={{ children: 'Configured' }}>Item</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );

    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('shows the menu action only on hover when configured', () => {
    renderInProvider(
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuAction showOnHover aria-label="hover-action">
            …
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    );

    expect(screen.getByLabelText('hover-action')).toBeInTheDocument();
  });

  it('renders sub-menu items and sub-buttons with sizes and active state', () => {
    renderInProvider(
      <SidebarMenuSub>
        <SidebarMenuSubItem>
          <SidebarMenuSubButton size="sm" isActive href="/a">
            Small active
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
        <SidebarMenuSubItem>
          <SidebarMenuSubButton asChild>
            <a href="/b">Slotted sub</a>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      </SidebarMenuSub>
    );

    const small = screen.getByText('Small active');
    expect(small).toHaveAttribute('data-size', 'sm');
    expect(small).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('link', { name: 'Slotted sub' })).toBeInTheDocument();
  });

  it('renders the skeleton with and without an icon', () => {
    const { rerender } = renderInProvider(<SidebarMenuSkeleton data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveAttribute('data-sidebar', 'menu-skeleton');
    expect(
      screen.queryByTestId('sk')?.querySelector('[data-sidebar="menu-skeleton-icon"]')
    ).toBeNull();

    rerender(
      <SidebarProvider>
        <SidebarMenuSkeleton showIcon data-testid="sk" />
      </SidebarProvider>
    );
    expect(
      screen.getByTestId('sk').querySelector('[data-sidebar="menu-skeleton-icon"]')
    ).not.toBeNull();
  });
});
